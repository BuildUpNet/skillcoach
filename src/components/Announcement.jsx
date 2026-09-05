export default function Announcement({ children }) {
  if (!children) return null;
  return (
    <div className="border-b border-[#f3cfc3] bg-orange-soft py-3 text-[15px] font-semibold text-crimson">
      <div className="mx-auto w-[min(1180px,100%-40px)]">{children}</div>
    </div>
  );
}
