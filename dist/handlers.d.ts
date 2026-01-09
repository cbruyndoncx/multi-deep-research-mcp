import { z } from "zod";
export declare const createRequestSchema: z.ZodObject<{
    provider: z.ZodOptional<z.ZodString>;
    model: z.ZodOptional<z.ZodString>;
    query: z.ZodString;
    system_message: z.ZodOptional<z.ZodString>;
    include_code_interpreter: z.ZodDefault<z.ZodBoolean>;
    parameters: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    query: string;
    include_code_interpreter: boolean;
    model?: string | undefined;
    provider?: string | undefined;
    system_message?: string | undefined;
    parameters?: Record<string, any> | undefined;
}, {
    query: string;
    model?: string | undefined;
    provider?: string | undefined;
    system_message?: string | undefined;
    include_code_interpreter?: boolean | undefined;
    parameters?: Record<string, any> | undefined;
}>;
export declare const statusSchema: z.ZodObject<{
    request_id: z.ZodString;
    provider: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    request_id: string;
    provider?: string | undefined;
}, {
    request_id: string;
    provider?: string | undefined;
}>;
export declare const listModelsSchema: z.ZodObject<{
    provider: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    provider?: string | undefined;
}, {
    provider?: string | undefined;
}>;
export declare const listProvidersSchema: z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>;
type CreateInputs = z.infer<typeof createRequestSchema>;
type StatusInputs = z.infer<typeof statusSchema>;
export declare function handleCreateTool(inputs: CreateInputs): Promise<{
    content: {
        type: "text";
        text: string;
    }[];
}>;
export declare function handleStatusTool(inputs: StatusInputs): Promise<{
    content: {
        type: "text";
        text: string;
    }[];
}>;
export declare function handleResultsTool(inputs: StatusInputs): Promise<{
    content: {
        type: "text";
        text: string;
    }[];
}>;
export declare function reasoningModelsHandler(inputs: z.infer<typeof listModelsSchema>): Promise<{
    content: {
        type: "text";
        text: string;
    }[];
}>;
export declare function reasoningProvidersHandler(): Promise<{
    content: {
        type: "text";
        text: string;
    }[];
}>;
export {};
//# sourceMappingURL=handlers.d.ts.map