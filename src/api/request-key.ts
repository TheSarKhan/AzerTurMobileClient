// Used only by the explicitly labelled legacy demo payment simulator.
export function demoRequestKey(id: string) {
  return Date.now() + "-" + Math.random().toString(36).slice(2) + "-" + id;
}
