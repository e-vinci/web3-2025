import { getPermalink, getBlogPermalink } from './utils/permalinks';

export const headerData = {
  links: [
    {
      text: 'Pages',
      links: [
        {
          text: 'Introduction (slides)',
          href: 'https://raw.githubusercontent.com/e-vinci/web3-2025/refs/heads/main/src/slides/intro.pptx',
        },
        {
          text: 'Moodle',
          href: 'https://moodle.vinci.be/course/view.php?id=494',
        },
        {
          text: 'Evaluation',
          href: getPermalink('/evaluation'),
        },
        {
          text: 'Teachers',
          href: getPermalink('/home/teachers'),
        },
        {
          text: 'Course Objectives',
          href: getPermalink('/goals'),
        },
      ],
    },
    {
      text: 'Course Lessons',
      links: [
        {
          text: 'Lesson 1: React Basics Recap',
          href: getPermalink('course-lessons/lesson-1-refresh', 'post'),
        },
        {
          text: 'Lesson 2: Deploy and persistence',
          href: getPermalink('course-lessons/lesson-2-deploy-persistence', 'post'),
        },
        {
          text: 'Lesson 3: Styles and navigation',
          href: getPermalink('course-lessons/lesson-3-routing-styles', 'post'),
        },
        {
          text: 'Lesson 4: Advanced state',
          href: getPermalink('course-lessons/lesson-4-advanced-state', 'post'),
        },
        {
          text: 'Lesson 5: GraphQL',
          href: getPermalink('course-lessons/lesson-5-graphql', 'post'),
        },
        {
          text: 'Lesson 6: When things go wrong',
          href: getPermalink('course-lessons/lesson-6-when-things-go-wrong', 'post'),
        },
        {
          text: 'Aside 1: When things go wrong',
          href: 'https://github.com/e-vinci/web3-2025/raw/refs/heads/main/src/slides/it-does-not-work.pptx',
        },
        // {
        //   text: 'Lesson 7: Performance and monitoring',
        //   href: getPermalink('course-lessons/lesson-7-performance-monitoring', 'post'),
        // },
        {
          text: 'All',
          href: getBlogPermalink(),
        },
      ],
    },
  ],
};

export const footerData = {
  links: [],
  secondaryLinks: [],
  socialLinks: [],
};
