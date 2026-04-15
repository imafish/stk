export const Readability = jest.fn().mockImplementation(() => ({
  parse: jest.fn().mockReturnValue({
    title: "Mock Article Title",
    content: "<div><p>Mock article content.</p></div>",
    byline: "Mock Author",
    excerpt: "Mock excerpt",
  }),
}));
