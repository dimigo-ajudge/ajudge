import { ArgumentsHost, Catch, ExceptionFilter, Logger } from "@nestjs/common";
import type { FastifyReply } from "fastify";
import { createApiFailure } from "$/utils/api-response.util";

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const failure = createApiFailure(exception, this.logger);

    response.status(failure.status).send(failure);
  }
}
