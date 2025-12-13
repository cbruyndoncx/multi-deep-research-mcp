#!/usr/bin/env node
import { spawn } from 'child_process';

const TEST_TIMEOUT = 300000; // 5 minutes for deep research
const OPENAI_TEST_MODEL = process.env.OPENAI_TEST_MODEL || 'o4-mini';

class MCPTester {
  constructor() {
    this.serverProcess = null;
    this.testResults = [];
    this.availableProviders = {
      openai: Boolean(process.env.OPENAI_API_KEY || process.env.TEST_OPENAI_API_KEY),
      deepseek: Boolean(process.env.DEEPSEEK_API_KEY),
    };
  }

  hasAnyProvider() {
    return Object.values(this.availableProviders).some(Boolean);
  }

  hasProvider(name) {
    return Boolean(this.availableProviders[name]);
  }

  logEnvironment() {
    console.log('🧭 Test Environment');
    const providers = Object.entries(this.availableProviders)
      .filter(([, enabled]) => enabled)
      .map(([id]) => id);
    console.log(`   Providers with credentials: ${providers.length ? providers.join(', ') : 'none'}`);
    console.log(`   Default provider: ${process.env.REASONING_DEFAULT_PROVIDER || 'openai (fallback)'}`);
    console.log(`   Favorite models (OPENAI): ${process.env.OPENAI_FAVORITE_MODELS || 'not set'}`);
    console.log(`   Favorite models (DEEPSEEK): ${process.env.DEEPSEEK_FAVORITE_MODELS || 'not set'}`);
    console.log(`   OpenAI test model: ${OPENAI_TEST_MODEL}`);
  }

  async startServer() {
    console.log('Starting MCP server...');
    
    this.serverProcess = spawn('node', ['dist/server.js'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: process.cwd().includes('tests') ? '..' : '.',
      env: {
        ...process.env,
        OPENAI_API_KEY: process.env.OPENAI_API_KEY || process.env.TEST_OPENAI_API_KEY
      }
    });

    return new Promise((resolve, reject) => {
      let output = '';
      
      this.serverProcess.stdout.on('data', (data) => {
        output += data.toString();
        if (output.includes('Server started')) {
          resolve();
        }
      });

      this.serverProcess.stderr.on('data', (data) => {
        const message = data.toString();
        console.error('Server stderr:', message);
        if (message.includes('listening for connections')) {
          resolve();
        }
      });

      setTimeout(() => {
        if (!output.includes('Server started')) {
          resolve(); // Assume it started
        }
      }, 2000);

      this.serverProcess.on('error', reject);
    });
  }

  async sendMCPRequest(method, params = {}) {
    const request = {
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params
    };

    return new Promise((resolve, reject) => {
      let response = '';
      
      const timeout = setTimeout(() => {
        reject(new Error(`Request timeout for ${method}`));
      }, TEST_TIMEOUT);

      const dataHandler = (data) => {
        response += data.toString();
        try {
          const lines = response.split('\n').filter(line => line.trim());
          for (const line of lines) {
            if (line.trim()) {
              const parsed = JSON.parse(line);
              if (parsed.id === request.id) {
                clearTimeout(timeout);
                this.serverProcess.stdout.removeListener('data', dataHandler);
                resolve(parsed);
                return;
              }
            }
          }
        } catch (e) {
          // Continue collecting data
        }
      };

      this.serverProcess.stdout.on('data', dataHandler);
      this.serverProcess.stdin.write(JSON.stringify(request) + '\n');
    });
  }

  async test(name, description, testFn) {
    console.log(`\n🧪 Running test: ${name}`);
    console.log(`   ${description}`);
    
    try {
      const result = await testFn();
      console.log(`✅ ${name}: PASSED`);
      const summary = result && typeof result === 'object' && result.summary ? result.summary : undefined;
      this.testResults.push({ name, status: 'PASSED', description, summary, result });
      return result;
    } catch (error) {
      console.log(`❌ ${name}: FAILED`);
      console.log(`   Error: ${error.message}`);
      this.testResults.push({ name, status: 'FAILED', description, error: error.message });
      throw error;
    }
  }

  skipTest(name, description, reason) {
    console.log(`\n⚪ Skipping test: ${name}`);
    console.log(`   ${description}`);
    console.log(`   Reason: ${reason}`);
    this.testResults.push({ name, status: 'SKIPPED', description, summary: reason });
  }

  async cleanup() {
    if (this.serverProcess) {
      this.serverProcess.kill();
    }
  }

  async runAllTests() {
    try {
      this.logEnvironment();
      if (!this.hasAnyProvider()) {
        throw new Error('OPENAI_API_KEY/TEST_OPENAI_API_KEY or DEEPSEEK_API_KEY required to run tests.');
      }
      await this.startServer();
      
      // Test 1: List available tools
      await this.test('List Tools', 'Ensures required MCP tools are registered before running functional checks.', async () => {
        const response = await this.sendMCPRequest('tools/list');
        if (!response.result || !response.result.tools) {
          throw new Error('No tools returned');
        }
        
        const toolNames = response.result.tools.map(tool => tool.name);
        const expectedTools = [
          'research_request_create',
          'research_request_check_status',
          'research_request_get_results',
          'openai_deep_research_create',
          'openai_deep_research_check_status', 
          'openai_deep_research_get_results'
        ];
        
        for (const tool of expectedTools) {
          if (!toolNames.includes(tool)) {
            throw new Error(`Missing tool: ${tool}`);
          }
        }
        
        return {
          summary: `Registered tools: ${toolNames.join(', ')}`,
          toolNames,
        };
      });

      // Test 2: List reasoning models
      await this.test('List Reasoning Models', 'Calls reasoning_models_list to confirm providers expose at least one model with metadata.', async () => {
        const response = await this.sendMCPRequest('tools/call', {
          name: 'reasoning_models_list',
          arguments: {}
        });

        if (!response.result || !response.result.content) {
          throw new Error('No content in reasoning_models_list response');
        }

        const payload = JSON.parse(response.result.content[0].text);
        if (!payload.providers || !Array.isArray(payload.providers)) {
          throw new Error('Providers list missing from reasoning_models_list response');
        }

        const providerSummaries = payload.providers.map((provider) => ({
          provider: provider.provider,
          modelCount: provider.models ? provider.models.length : 0,
          favorites: provider.favorites ? provider.favorites.length : 0,
          error: provider.error,
          envKeys: provider.env,
          sampleModel: provider.models && provider.models.length ? provider.models[0] : null,
        }));

        const validProvider = providerSummaries.find((entry) => entry.modelCount > 0 && !entry.error);
        if (!validProvider) {
          throw new Error('No provider returned usable models.');
        }

        return {
          summary: providerSummaries.map((entry) => `${entry.provider}: ${entry.modelCount} models`).join('; '),
          providers: providerSummaries,
        };
      });

      await this.test('OpenAI Model Details', 'Confirms reasoning_models_list returns full metadata for every OpenAI model plus env keys.', async () => {
        const response = await this.sendMCPRequest('tools/call', {
          name: 'reasoning_models_list',
          arguments: { provider: 'openai' }
        });
        if (!response.result || !response.result.content) {
          throw new Error('No content in reasoning_models_list response');
        }
        const payload = JSON.parse(response.result.content[0].text);
        const entry = Array.isArray(payload.providers) ? payload.providers.find((p) => p.provider === 'openai') : null;
        if (!entry) {
          throw new Error('OpenAI provider missing from reasoning_models_list response');
        }
        if (!entry.models || !entry.models.length) {
          throw new Error('OpenAI provider did not return any models');
        }
        const modelSummaries = entry.models.map((model) => {
          if (!model.id) {
            throw new Error('Model missing id');
          }
          if (typeof model.has_parameter_schema === 'undefined') {
            throw new Error(`Model ${model.id} missing parameter schema metadata`);
          }
          const reasoning = typeof model.supports_reasoning === 'boolean' ? model.supports_reasoning : 'unknown';
          return `${model.id} (schema=${model.has_parameter_schema}, reasoning=${reasoning})`;
        });
        if (!entry.env || !entry.env.favorites_key || !entry.env.default_model_key) {
          throw new Error('OpenAI provider missing env key metadata');
        }
        console.log('   OpenAI model details:\n', JSON.stringify(entry, null, 2));
        return {
          summary: `OpenAI models (${entry.models.length}): ${modelSummaries.join('; ')}`,
          data: { models: entry.models, env: entry.env },
        };
      });

      await this.test('DeepSeek Model Details', 'Confirms reasoning_models_list returns metadata for DeepSeek models and env keys.', async () => {
        const response = await this.sendMCPRequest('tools/call', {
          name: 'reasoning_models_list',
          arguments: { provider: 'deepseek' }
        });
        if (!response.result || !response.result.content) {
          throw new Error('No content in reasoning_models_list response');
        }
        const payload = JSON.parse(response.result.content[0].text);
        const entry = Array.isArray(payload.providers) ? payload.providers.find((p) => p.provider === 'deepseek') : null;
        if (!entry) {
          throw new Error('DeepSeek provider missing from reasoning_models_list response');
        }
        if (!entry.models || !entry.models.length) {
          throw new Error('DeepSeek provider did not return any models');
        }
        const modelSummaries = entry.models.map((model) => {
          if (!model.id) {
            throw new Error('DeepSeek model missing id');
          }
          if (typeof model.has_parameter_schema === 'undefined') {
            throw new Error(`DeepSeek model ${model.id} missing parameter schema metadata`);
          }
          const reasoning = typeof model.supports_reasoning === 'boolean' ? model.supports_reasoning : 'unknown';
          return `${model.id} (schema=${model.has_parameter_schema}, reasoning=${reasoning})`;
        });
        if (!entry.env || !entry.env.favorites_key || !entry.env.default_model_key) {
          throw new Error('DeepSeek provider missing env key metadata');
        }
        console.log('   DeepSeek model details:\n', JSON.stringify(entry, null, 2));
        return {
          summary: `DeepSeek models (${entry.models.length}): ${modelSummaries.join('; ')}`,
          data: { models: entry.models, env: entry.env },
        };
      });

      // Test 3: Legacy alias guard
      await this.test('Legacy OpenAI Alias Guard', 'Ensures openai_deep_research_* tools reject non-OpenAI providers.', async () => {
        const response = await this.sendMCPRequest('tools/call', {
          name: 'openai_deep_research_create',
          arguments: {
            provider: 'deepseek',
            query: 'Test blocking behavior',
            model: 'deepseek-reasoner'
          }
        });

        if (!response.result || !response.result.content) {
          throw new Error('No content in alias guard response');
        }

        const payload = JSON.parse(response.result.content[0].text);
        if (!payload.error || !payload.error.includes("provider 'openai'")) {
          throw new Error('Legacy alias did not reject non-OpenAI provider.');
        }

        return {
          summary: 'Legacy alias correctly rejected provider mismatch.',
          data: payload,
        };
      });

      // OpenAI flow (optional)
      let openaiRequestId;
      let openaiInitialStatus;
      if (this.hasProvider('openai')) {
        await this.test('OpenAI • Create Research Request', 'Submits a short OpenAI Deep Research job and validates the returned request id/status.', async () => {
          const response = await this.sendMCPRequest('tools/call', {
            name: 'research_request_create',
            arguments: {
              query: 'What is 2+2? Give a very brief answer.',
              model: OPENAI_TEST_MODEL
            }
          });
        
        if (!response.result || !response.result.content) {
          throw new Error('No content in response');
        }
        
        const content = JSON.parse(response.result.content[0].text);
        if (!content.request_id) {
          throw new Error('No request_id in response');
        }
        
        if (!content.request_id.startsWith('resp_')) {
          throw new Error(`Expected OpenAI response ID (starts with 'resp_'), got '${content.request_id}'`);
        }
        
        if (!['queued', 'pending', 'in_progress', 'completed'].includes(content.status)) {
          throw new Error(`Unexpected initial status '${content.status}'`);
        }
        
        openaiRequestId = content.request_id;
        openaiInitialStatus = content.status;
        return {
          summary: `Created request ${openaiRequestId} using model ${content.model}, initial status ${content.status}`,
          data: content,
        };
      });

        await this.test('OpenAI • Check Request Status', 'Polls research_request_check_status to ensure IDs match and status transitions are accepted.', async () => {
          const response = await this.sendMCPRequest('tools/call', {
            name: 'research_request_check_status',
            arguments: {
            request_id: openaiRequestId
          }
        });
        
        if (!response.result || !response.result.content) {
          throw new Error('No content in response');
        }
        
        const content = JSON.parse(response.result.content[0].text);
          if (!content.request_id || content.request_id !== openaiRequestId) {
            throw new Error('Request ID mismatch');
          }
        
        if (!['queued', 'pending', 'in_progress', 'completed', 'failed'].includes(content.status)) {
          throw new Error(`Invalid status: ${content.status}`);
        }
        
        return {
          summary: `Status for ${openaiRequestId}: ${content.status}`,
          data: content,
        };
      });

        await this.test('OpenAI • Get Research Results', 'Waits for completion (max 5 min) and validates that a report payload is returned.', async () => {
        // Poll for completion
        let attempts = 0;
        let statusResponse;
        
        if (openaiInitialStatus !== 'completed') {
          while (attempts < 30) { // Max 5 minutes
            await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
            
            statusResponse = await this.sendMCPRequest('tools/call', {
              name: 'research_request_check_status',
              arguments: { request_id: openaiRequestId }
            });
            
            const statusContent = JSON.parse(statusResponse.result.content[0].text);
            console.log(`   Status check ${attempts + 1}: ${statusContent.status}`);
            
            if (statusContent.status === 'completed') {
              break;
            } else if (statusContent.status === 'failed') {
              throw new Error('Research request failed');
            }
            
            attempts++;
          }
          
          if (attempts >= 30) {
            throw new Error('Request did not complete within timeout');
          }
        }
        
        // Get results
        const response = await this.sendMCPRequest('tools/call', {
          name: 'research_request_get_results',
          arguments: {
            request_id: openaiRequestId
          }
        });
        
        if (!response.result || !response.result.content) {
          throw new Error('No content in response');
        }
        
        const content = JSON.parse(response.result.content[0].text);
        
        if (content.error) {
          throw new Error(`Error getting results: ${content.error}`);
        }
        
        if (!content.results || !content.results.report) {
          throw new Error('No report in results');
        }
        
        console.log(`   📝 Report preview: ${content.results.report.substring(0, 100)}...`);
        
        return {
          summary: `Retrieved report (${content.results.report.length} chars, ${content.results.citation_count} citations).`,
          data: content,
        };
      });
      } else {
        this.skipTest(
          'OpenAI • Research Flow',
          'Requires OPENAI_API_KEY or TEST_OPENAI_API_KEY to run lifecycle tests.',
          'Set OPENAI_API_KEY to enable these tests.'
        );
      }

      // DeepSeek flow (optional)
      let deepseekRequestId;
      if (this.hasProvider('deepseek')) {
        await this.test('DeepSeek • Create Research Request', 'Submits a DeepSeek reasoning request and validates synchronous completion metadata.', async () => {
          const response = await this.sendMCPRequest('tools/call', {
            name: 'research_request_create',
            arguments: {
              provider: 'deepseek',
              query: 'Summarize 2+2 in one short sentence.',
              model: 'deepseek-reasoner',
              include_code_interpreter: false,
              parameters: {
                temperature: 0.2
              }
            }
          });

          if (!response.result || !response.result.content) {
            throw new Error('No content in response');
          }

          const content = JSON.parse(response.result.content[0].text);
          if (!content.request_id) {
            throw new Error('No request_id in response');
          }
          if (content.provider !== 'deepseek') {
            throw new Error(`Expected provider deepseek, got ${content.provider}`);
          }
          if (content.status !== 'completed') {
            throw new Error(`DeepSeek request should complete synchronously, got status ${content.status}`);
          }

          deepseekRequestId = content.request_id;
          return {
            summary: `Created DeepSeek request ${deepseekRequestId} with status ${content.status}`,
            data: content,
          };
        });

        await this.test('DeepSeek • Check Request Status', 'Ensures deepseek status endpoint returns completed metadata.', async () => {
          const response = await this.sendMCPRequest('tools/call', {
            name: 'research_request_check_status',
            arguments: {
              provider: 'deepseek',
              request_id: deepseekRequestId
            }
          });

          if (!response.result || !response.result.content) {
            throw new Error('No content in response');
          }

          const content = JSON.parse(response.result.content[0].text);
          if (content.provider !== 'deepseek') {
            throw new Error(`Expected provider deepseek, got ${content.provider}`);
          }
          if (content.status !== 'completed') {
            throw new Error(`DeepSeek status should be completed, got ${content.status}`);
          }

          return {
            summary: `DeepSeek status confirmed as ${content.status}`,
            data: content,
          };
        });

        await this.test('DeepSeek • Get Research Results', 'Retrieves the synchronous DeepSeek response stored during creation.', async () => {
          const response = await this.sendMCPRequest('tools/call', {
            name: 'research_request_get_results',
            arguments: {
              provider: 'deepseek',
              request_id: deepseekRequestId
            }
          });

          if (!response.result || !response.result.content) {
            throw new Error('No content in response');
          }

          const content = JSON.parse(response.result.content[0].text);
          if (!content.results || !content.results.report) {
            throw new Error('No report in DeepSeek results');
          }

          console.log(`   📝 DeepSeek preview: ${content.results.report.substring(0, 100)}...`);
          return {
            summary: `DeepSeek report length ${content.results.report.length} chars`,
            data: content,
          };
        });
      } else {
        this.skipTest(
          'DeepSeek • Research Flow',
          'Requires DEEPSEEK_API_KEY to run lifecycle tests.',
          'Set DEEPSEEK_API_KEY to enable these tests.'
        );
      }

      console.log('\n🎉 All tests passed! See the summary below for detailed coverage.');
      
    } catch (error) {
      console.log(`\n💥 Test suite failed: ${error.message}`);
      process.exit(1);
    } finally {
      await this.cleanup();
    }
  }

  printSummary() {
    console.log('\n📊 Test Summary:');
    for (const result of this.testResults) {
      if (result.status === 'PASSED') {
        console.log(`   ✅ ${result.name} – ${result.description}`);
        if (result.summary) {
          console.log(`      ↳ ${result.summary}`);
        }
      } else {
        console.log(`   ❌ ${result.name} – ${result.description}`);
        console.log(`      ↳ Error: ${result.error}`);
      }
    }
  }
}

// Require at least one provider credential
if (
  !process.env.OPENAI_API_KEY &&
  !process.env.TEST_OPENAI_API_KEY &&
  !process.env.DEEPSEEK_API_KEY
) {
  console.error('❌ Error: Provide OPENAI_API_KEY (or TEST_OPENAI_API_KEY) and/or DEEPSEEK_API_KEY before running tests.');
  process.exit(1);
}

// Run tests
const tester = new MCPTester();
tester.runAllTests().then(() => {
  tester.printSummary();
}).catch(error => {
  console.error('Test suite error:', error);
  tester.printSummary();
  process.exit(1);
});
