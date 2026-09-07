// Shared mock forum data — replace with real API data once forums are wired up.
// Keeping this in one file so Forums.jsx, ForumTopics.jsx and ForumTopic.jsx
// (and your backend, later) all agree on the same shape.

export const FORUMS = {
  "8": {
    id: "8",
    slug: "std-work",
    name: "STD Work",
    subtitle: "Ongoing Project",
    category: "General",
    topics: [
      {
        id: "547626",
        slug: "create-a-members-page",
        title: "Create a Members Page",
        views: 18930,
        lastPost: { author: "Thomas Kee", date: "March 27, 2025" },
        posts: [
          {
            author: "Thomas Kee",
            date: "March 27, 2025 · 7:45 PM IST",
            postCount: 3,
            content:
              "We need to create a members page with four quadrants: 1. My assignments 2. My tasks 3. My worked hours 4. Forum for STD work",
          },
          {
            author: "Thomas Kee",
            date: "March 27, 2025 · 7:46 PM IST",
            postCount: 3,
            content:
              "Bret, please produce this page. Just do it fast, we will make changes to it anyway. It does not need to be perfect.",
          },
          {
            author: "Thomas Kee",
            date: "March 27, 2025 · 7:49 PM IST",
            postCount: 3,
            content:
              "I realize that the forum is not yet set up to work on the 4th quadrant. We can fix that. For now, make it like a placeholder.",
          },
        ],
      },
      {
        id: "547625",
        slug: "demo-2-27",
        title: "demo 2 - 27",
        views: 7549,
        lastPost: { author: "Bret Delchambre", date: "March 27, 2025" },
        posts: [
          {
            author: "Bret Delchambre",
            date: "March 27, 2025 · 5:35 PM IST",
            postCount: 7,
            content: "demo",
          },
        ],
      },
      {
        id: "547624",
        slug: "demo-topic-27-march",
        title: "demo topic 27 march",
        views: 7412,
        lastPost: { author: "Bret Delchambre", date: "March 27, 2025" },
        posts: [
          {
            author: "Bret Delchambre",
            date: "March 27, 2025 · 5:33 PM IST",
            postCount: 7,
            content: "test",
          },
        ],
      },
    ],
  },
};

const TONES = [
  "bg-forest text-white",
  "bg-gold text-ink",
  "bg-crimson text-white",
  "bg-ink text-white",
];

export function initials(name) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function toneFor(name) {
  let sum = 0;
  for (const c of name) sum += c.charCodeAt(0);
  return TONES[sum % TONES.length];
}

export function replyCount(topic) {
  return Math.max(0, topic.posts.length - 1);
}