const PATHS = {
  grid: "M4 5h6v6H4V5zm10 0h6v6h-6V5zM4 15h6v6H4v-6zm10 0h6v6h-6v-6z",
  check: "M4 12l5 5L20 6",
  clipboard: "M9 4.5h6a1 1 0 011 1V6h1.5A1.5 1.5 0 0119 7.5v12A1.5 1.5 0 0117.5 21h-11A1.5 1.5 0 015 19.5v-12A1.5 1.5 0 016.5 6H8v-.5a1 1 0 011-1z",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  chart: "M4 20V10m7 10V4m7 16v-7",
  clock: "M12 7v5l3 3M12 21a9 9 0 100-18 9 9 0 000 18z",
  users: "M17 20v-1a4 4 0 00-4-4H7a4 4 0 00-4 4v1m18 0v-1a4 4 0 00-3-3.87M14 3.13a4 4 0 010 7.75M9 11a4 4 0 100-8 4 4 0 000 8z",
  userPlus: "M13 20v-1a4 4 0 00-4-4H5a4 4 0 00-4 4v1M18 8v6m3-3h-6M9 11a4 4 0 100-8 4 4 0 000 8z",
  pulse: "M3 12h4l2 8 4-16 2 8h6",
  book: "M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 006.5 22H20V4a2 2 0 00-2-2H6.5A2.5 2.5 0 004 4.5v15z",
  back: "M15 18l-6-6 6-6",
  refresh: "M4 4v6h6M20 20v-6h-6M4.5 15a8 8 0 0014.5 3M19.5 9A8 8 0 005 6",
  mail: "M3 6.5h18v11H3v-11zm0 0l9 7 9-7",
  send: "M3 20l18-8L3 4v6l12 2-12 2v6z",
  edit: "M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z",
  search: "M17 10.5A6.5 6.5 0 114 10.5a6.5 6.5 0 0113 0zM21 21l-4.8-4.8",
  link: "M8 12l6-6a4 4 0 115.657 5.657l-2 2M16 12l-6 6a4 4 0 11-5.657-5.657l2-2",
  music: "M9 18V5l12-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0zm12-2a3 3 0 11-6 0 3 3 0 016 0z",
};

export default function Icon({ name, className = "h-5 w-5", strokeWidth = 1.9 }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={PATHS[name] || ""} />
    </svg>
  );
}