import React from 'react';

interface MarkdownProps {
 content: string;
}

const Markdown: React.FC<MarkdownProps> = ({ content }) => {
 return (
  <div className="markdown">
   {/* Render your markdown content here */}
   {content}
  </div>
 );
};

export default Markdown;