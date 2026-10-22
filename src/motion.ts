export const motion = {
  duration: 180,
  easing: "cubic-bezier(.65, 0, .35, 1)",
} as const;
export function installMotionTokens() {
  document.documentElement.style.setProperty(
    "--motion-duration",
    `${motion.duration}ms`,
  );
  document.documentElement.style.setProperty("--motion-easing", motion.easing);
}
