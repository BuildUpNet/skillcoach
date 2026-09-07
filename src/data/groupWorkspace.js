const workspaces = {
  1: {
    info: {
      id: 1,
      name: "STD Work",
      subtitle: "Stock Traders Daily",
      description:
        "Collaborate on product, content and support work for Stock Traders Daily — an ongoing project.",
      image: "/groups/std.png",
      leader: "Thomas Kee",
      memberCount: 10,
      lessonCount: 2,
      topicCount: 3,
      postCount: 5,
    },

    tasks: [
      {
        id: 1,
        title: "Automated Market Analysis",
        assignee: "Thomas Kee",
        date: "August 26",
        priority: "Highest",
        status: "In progress",
        description: "Automate the daily market analysis summary so it publishes without manual copy-pasting from the data feed.",
        assignments: [
          {
            id: 1,
            title: "Kick off the automation with the assistant",
            assignee: "Damini",
            date: "August 26",
            done: true,
            details: "This is already handled — open the page, run the assistant on the near-term analysis, and check it off once matched.",
            comments: [],
            workedHours: [],
          },
          {
            id: 2,
            title: "Wire up the server data source",
            assignee: "Damini",
            date: "August 26",
            done: false,
            details:
              "The feed data comes straight from the server job — check the stock-report page script for where it's sourced from, then pull the same feed rather than calling a separate quote API. Ping the channel if you need the report link again.",
            comments: [],
            workedHours: [],
          },
          {
            id: 3,
            title: "Keep the vendor RSS structure intact",
            assignee: "Saurabh",
            date: "August 28",
            done: false,
            details:
              "The vendor feed needs a sleek, professional layout, but some of the wording is intentionally left as-is — that's how the RSS feed arrives from the vendor, so keep that structure rather than rewriting it.",
            comments: [{ id: 1, author: "Thomas Kee", text: "Agreed — just tidy the surrounding layout, leave their copy alone.", date: "Aug 28" }],
            workedHours: [{ id: 1, person: "Saurabh", hours: 1.5, date: "Aug 28" }],
          },
        ],
      },
      {
        id: 2,
        title: "Chat Room and Live Help",
        assignee: "Priya Nair",
        date: "August 6",
        priority: "Normal",
        status: "In progress",
        description: "Stand up a live chat room for members to get help in real time during market hours.",
        assignments: [
          {
            id: 1,
            title: "Route overflow chats to email",
            assignee: "Priya Nair",
            date: "August 6",
            done: false,
            details: "While we're under capacity, overflow chats outside market hours should fall back to an email ticket instead of queuing indefinitely.",
            comments: [{ id: 1, author: "Thomas Kee", text: "Let's route overflow chats to email for now.", date: "Aug 5" }],
            workedHours: [],
          },
        ],
      },
      {
        id: 3,
        title: "Page fixes",
        assignee: "Marcus Lee",
        date: "July 23",
        priority: "Normal",
        status: "Completed",
        description: "Roundup of small broken-link and layout fixes reported across the site this month.",
        assignments: [
          {
            id: 1,
            title: "Fix broken links on earnings page",
            assignee: "Marcus Lee",
            date: "July 23",
            done: true,
            details: "All reported broken links on the earnings page fixed and verified in staging.",
            comments: [{ id: 1, author: "Marcus Lee", text: "All reported links fixed and verified in staging.", date: "Jul 23" }],
            workedHours: [{ id: 1, person: "Marcus Lee", hours: 1.25, date: "Jul 23" }],
          },
        ],
      },
      {
        id: 4,
        title: "Fix news and market analysis",
        assignee: "Thomas Kee",
        date: "June 9",
        priority: "Highest",
        status: "Completed",
        description: "News and market analysis pages were showing stale data after the feed migration — root-caused and fixed.",
        assignments: [
          {
            id: 1,
            title: "Root-cause stale feed data",
            assignee: "Thomas Kee",
            date: "June 9",
            done: true,
            details: "Traced to the feed migration leaving the old cache key in place. Cleared and repointed to the new key.",
            comments: [],
            workedHours: [{ id: 1, person: "Thomas Kee", hours: 2, date: "Jun 9" }],
          },
        ],
      },
      {
        id: 5,
        title: "Earnings page enhancement",
        assignee: "Sofia Ruiz",
        date: "August 25",
        priority: "Normal",
        status: "Not started",
        description: "Add quarter-over-quarter comparison and a clearer call-out for upcoming earnings dates.",
        assignments: [
          {
            id: 1,
            title: "Confirm data source for QoQ comparison",
            assignee: "Sofia Ruiz",
            date: "August 25",
            done: false,
            details: "Check whether the QoQ figures can come from the existing feed or need a new endpoint before building the widget.",
            comments: [],
            workedHours: [],
          },
        ],
      },
      {
        id: 6,
        title: "Trade log page navigation issue",
        assignee: "Priya Nair",
        date: "August 20",
        priority: "Highest",
        status: "In progress",
        description: "Pagination on the trade log occasionally jumps back to page 1 after a filter change.",
        assignments: [
          {
            id: 1,
            title: "Reproduce and patch the pagination reset",
            assignee: "Priya Nair",
            date: "August 20",
            done: true,
            details: "Found it — filter state was resetting the page index on every change. Patched to preserve the current page.",
            comments: [{ id: 1, author: "Priya Nair", text: "Found it — filter state was resetting the page index.", date: "Aug 21" }],
            workedHours: [{ id: 1, person: "Priya Nair", hours: 3, date: "Aug 21" }],
          },
          {
            id: 2,
            title: "QA the fix across saved filters",
            assignee: "Priya Nair",
            date: "August 22",
            done: false,
            details: "Re-run through every saved filter preset to confirm the page position now holds after a change.",
            comments: [],
            workedHours: [],
          },
        ],
      },
      {
        id: 7,
        title: "Broker directory data sync",
        assignee: "Marcus Lee",
        date: "August 9",
        priority: "Normal",
        status: "Not started",
        description: "Nightly sync between the broker directory and the CRM is dropping a handful of records.",
        assignments: [
          {
            id: 1,
            title: "Find the dropped-record pattern",
            assignee: "Marcus Lee",
            date: "August 9",
            done: false,
            details: "Compare a night's sync log against the CRM to isolate which records consistently fail to land.",
            comments: [],
            workedHours: [],
          },
        ],
      },
    ],

    timesheet: {
      Yesterday: [],
      Today: [
        { id: 1, task: "Automated Market Analysis", hours: 2.5, note: "Investigated data feed delay" },
      ],
      "This week": [
        { id: 1, task: "Automated Market Analysis", date: "Sep 3", hours: 2.5, note: "Investigated data feed delay" },
        { id: 2, task: "Page fixes", date: "Sep 2", hours: 1.25, note: "Fixed broken links on earnings page" },
        { id: 3, task: "Chat Room and Live Help", date: "Sep 1", hours: 3, note: "Set up live chat routing" },
      ],
      "This month": [
        { id: 1, task: "Automated Market Analysis", date: "Sep 3", hours: 2.5, note: "Investigated data feed delay" },
        { id: 2, task: "Page fixes", date: "Sep 2", hours: 1.25, note: "Fixed broken links on earnings page" },
        { id: 3, task: "Chat Room and Live Help", date: "Sep 1", hours: 3, note: "Set up live chat routing" },
        { id: 4, task: "Trade log page navigation issue", date: "Aug 20", hours: 4, note: "Reworked pagination" },
      ],
    },

    timeSummary: [
      { member: "Thomas Kee", role: "Owner", hours: 18.5 },
      { member: "Priya Nair", role: "Officer", hours: 12 },
      { member: "Marcus Lee", role: "Member", hours: 9.25 },
      { member: "Sofia Ruiz", role: "Member", hours: 6.5 },
      { member: "Daniel Cho", role: "Member", hours: 3 },
    ],

    members: [
      { id: 1, name: "Thomas Kee", role: "Owner", joined: "Jan 2023" },
      { id: 2, name: "Priya Nair", role: "Officer", joined: "Feb 2023" },
      { id: 3, name: "Marcus Lee", role: "Member", joined: "Mar 2023" },
      { id: 4, name: "Sofia Ruiz", role: "Member", joined: "Apr 2023" },
      { id: 5, name: "Daniel Cho", role: "Member", joined: "May 2023" },
      { id: 6, name: "Amara Bello", role: "Member", joined: "Jun 2023" },
      { id: 7, name: "Liam O'Connor", role: "Member", joined: "Jul 2023" },
      { id: 8, name: "Yuki Tanaka", role: "Member", joined: "Aug 2023" },
      { id: 9, name: "Elena Petrova", role: "Member", joined: "Sep 2023" },
      { id: 10, name: "Noah Williams", role: "Member", joined: "Oct 2023" },
    ],

    invitesPending: [
      { id: 1, email: "jordan.miles@example.com", sentDate: "August 22" },
      { id: 2, email: "casey.wren@example.com", sentDate: "August 18" },
    ],

    timeline: [
      { id: 1, text: "Thomas Kee marked \"Page fixes\" as completed", date: "Sep 3" },
      { id: 2, text: "Priya Nair logged 3h on \"Chat Room and Live Help\"", date: "Sep 1" },
      { id: 3, text: "Marcus Lee joined the group", date: "Aug 28" },
      { id: 4, text: "Thomas Kee created task \"News page design vendor structure\"", date: "Aug 28" },
      { id: 5, text: "Sofia Ruiz posted in \"STD Work\" forum", date: "Aug 24" },
      { id: 6, text: "Thomas Kee invited casey.wren@example.com", date: "Aug 18" },
      { id: 7, text: "Group \"STD Work\" was created", date: "Jan 12" },
    ],

    lessons: [
      {
        id: 1,
        title: "Reading the trade log like a pro",
        description: "A walkthrough of the trade log page, filters, and how to spot navigation issues before members report them.",
        duration: "18 min",
        progress: 100,
      },
      {
        id: 2,
        title: "Writing a good earnings page update",
        description: "Structure, tone, and data-sourcing guidelines for enhancement work on the earnings page.",
        duration: "24 min",
        progress: 40,
      },
    ],

    forum: {
      title: "STD Work",
      subtitle: "Ongoing project",
      topics: 3,
      posts: 5,
    },
  },
};

export function getGroupWorkspace(id) {
  const workspace = workspaces[String(id)] ?? null;
  if (!workspace) return null;

  const viewer = workspace.info.leader;
  const myTasks = workspace.tasks.filter((t) => t.assignee === viewer);
  const myAssignments = workspace.tasks.flatMap((t) =>
    t.assignments
      .filter((a) => a.assignee === viewer)
      .map((a) => ({ ...a, taskId: t.id, taskTitle: t.title }))
  );

  return { ...workspace, myTasks, myAssignments };
}

export function getTaskById(workspace, taskId) {
  return workspace.tasks.find((t) => String(t.id) === String(taskId)) ?? null;
}
