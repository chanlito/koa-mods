export async function sleepMiddleware(_: any, next: (err?: any) => void) {
  await sleep(1000);
  await next();
}

export async function sleepMiddlewareAlt(_: any, next: (err?: any) => void) {
  await next();
}

export function sleep(ms: number) {
  return new Promise((res, rej) => {
    setTimeout(() => res(), ms);
  });
}
