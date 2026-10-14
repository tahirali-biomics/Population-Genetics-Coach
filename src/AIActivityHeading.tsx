export function AIActivityHeading({ heading, task }: { heading: string; task?: string }) {
  return <><h4>{heading}</h4>{task && <p>{task}</p>}</>;
}
