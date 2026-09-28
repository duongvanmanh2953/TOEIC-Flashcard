import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    let user = request.user;
    if (!user && request.headers?.authorization) {
      try {
        const auth = request.headers.authorization;
        const [type, token] = auth.split(' ');
        if (type === 'Bearer' && token) {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
            if (payload && (payload.sub || payload.id)) {
              user = {
                id: payload.sub || payload.id,
                email: payload.email,
                role: payload.role,
              };
            }
          }
        }
      } catch (_) {}
    }
    return data ? user?.[data] : user;
  },
);

