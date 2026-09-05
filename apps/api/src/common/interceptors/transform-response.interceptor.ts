import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: Record<string, any>;
}

@Injectable()
export class TransformResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // If data already contains pagination meta or specific structure
        if (data && typeof data === 'object' && 'items' in data && 'pagination' in data) {
          return {
            success: true,
            data: data.items,
            meta: {
              pagination: data.pagination,
              timestamp: new Date().toISOString(),
            },
          };
        }
        return {
          success: true,
          data,
          meta: {
            timestamp: new Date().toISOString(),
          },
        };
      }),
    );
  }
}
