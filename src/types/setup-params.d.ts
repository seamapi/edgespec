export interface SetupParams<
  AuthMW extends AuthMiddlewares = AuthMiddlewares,
  GlobalMW extends Middleware<any, any>[] = any[],
  GlobalMWAfterAuth extends Middleware<any, any>[] = any[],
> {
  authMiddlewareMap: AuthMW
  globalMiddlewares: GlobalMW
  globalMiddlewaresAfterAuth?: GlobalMWAfterAuth
  exceptionHandlingMiddleware?: ((next: Function) => Function) | null

  // These improve OpenAPI generation
  apiName: string
  productionServerUrl: string

  addOkStatus?: boolean

  shouldValidateResponses?: boolean
  shouldValidateGetRequestBody?: boolean
  securitySchemas?: Record<string, SecuritySchemeObject>
  globalSchemas?: Record<string, z.ZodTypeAny>

  supportedArrayFormats?: QueryArrayFormats

  /**
   * If an endpoint accepts multiple auth methods and they all fail, this hook will be called with the errors thrown by the middlewares.
   * You can inspect the errors and throw a more generic error in this hook if you want.
   */
  onMultipleAuthMiddlewareFailures?: (errors: unknown[]) => void
}
