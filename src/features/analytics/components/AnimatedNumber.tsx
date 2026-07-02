export function AnimatedNumber({
  value,
  suffix = "",
}: {
  value: number;
  suffix?: string;
}) {
  return (
    <span>
      {value.toLocaleString()}
      {suffix}
    </span>
  );
}
