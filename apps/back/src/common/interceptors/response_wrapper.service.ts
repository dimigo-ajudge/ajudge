import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { ApiSuccess, createApiSuccess } from "$/utils/api-response.util";

@Injectable()
export class ResponseWrapperInterceptor<T> implements NestInterceptor<T, ApiSuccess<T>> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ApiSuccess<T>> {
    const response = context.switchToHttp().getResponse<{
      statusCode: number;
    }>();

    return next
      .handle()
      .pipe(map((data): ApiSuccess<T> => createApiSuccess(response.statusCode, data)));
  }
}
