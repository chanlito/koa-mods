export async function sleepMiddleware(_: any, next: (err?: any) => void) {
  await next();
}

export const sleepMiddlewareAlt = async (_: any, next: (err?: any) => void) => {
  await next();
};
