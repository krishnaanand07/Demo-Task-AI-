import { z } from "zod";

export type UIComponent = {
  id: string;
  type: string;
  props: Record<string, any>;
  children?: UIComponent[];
};

export const UIComponentSchema: z.ZodType<UIComponent> = z.lazy(() => z.object({
  id: z.string().describe("Unique identifier for the component"),
  type: z.string().describe("Type of component (e.g., 'button', 'table', 'form', 'text')"),
  props: z.record(z.string(), z.any()).describe("Component properties (e.g., label, placeholder, columns)"),
  children: z.array(UIComponentSchema).optional().describe("Nested components"),
}));

export const UIPageSchema = z.object({
  path: z.string().describe("Route path for the page (e.g., '/dashboard')"),
  title: z.string().describe("Page title"),
  layout: z.string().describe("Layout type (e.g., 'sidebar', 'centered')"),
  components: z.array(UIComponentSchema).describe("Components on this page"),
});

export const UIConfigSchema = z.object({
  theme: z.object({
    primaryColor: z.string(),
    secondaryColor: z.string(),
  }).optional(),
  pages: z.array(UIPageSchema),
});

// 2. API Config Schema
export const APIEndpointSchema = z.object({
  path: z.string().describe("API endpoint path (e.g., '/api/users')"),
  method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]),
  description: z.string().describe("What this endpoint does"),
  requestSchema: z.record(z.string(), z.any()).optional().describe("Expected JSON body schema"),
  responseSchema: z.record(z.string(), z.any()).optional().describe("Expected JSON response schema"),
  authRequired: z.boolean().describe("Whether this endpoint requires authentication"),
  requiredRoles: z.array(z.string()).optional().describe("Roles required to access this endpoint"),
});

export const APIConfigSchema = z.object({
  baseUrl: z.string().default("/api"),
  endpoints: z.array(APIEndpointSchema),
});

// 3. Database Schema
export const DBColumnSchema = z.object({
  name: z.string(),
  type: z.enum(["string", "integer", "boolean", "date", "datetime", "float", "json"]),
  isPrimaryKey: z.boolean().optional(),
  isNullable: z.boolean().optional(),
  isUnique: z.boolean().optional(),
  references: z.object({
    table: z.string(),
    column: z.string(),
  }).optional().describe("Foreign key reference"),
});

export const DBTableSchema = z.object({
  name: z.string(),
  columns: z.array(DBColumnSchema),
});

export const DBSchemaConfig = z.object({
  tables: z.array(DBTableSchema),
});

// 4. Auth Rules Schema
export const AuthRoleSchema = z.object({
  name: z.string().describe("Role name (e.g., 'admin', 'user')"),
  permissions: z.array(z.string()).describe("List of permissions (e.g., 'read:users', 'write:users')"),
});

export const AuthRulesSchema = z.object({
  roles: z.array(AuthRoleSchema),
  defaultRole: z.string().describe("Default role for new users"),
});

// Full Application Config Schema
export const AppConfigSchema = z.object({
  ui: UIConfigSchema,
  api: APIConfigSchema,
  db: DBSchemaConfig,
  auth: AuthRulesSchema,
});

export type UIConfig = z.infer<typeof UIConfigSchema>;
export type APIConfig = z.infer<typeof APIConfigSchema>;
export type DBSchema = z.infer<typeof DBSchemaConfig>;
export type AuthRules = z.infer<typeof AuthRulesSchema>;
export type AppConfig = z.infer<typeof AppConfigSchema>;
