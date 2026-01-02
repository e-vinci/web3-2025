import { useState } from 'react';
import type { Comment } from '@/types/Comment';

interface CommentListProps {
  comments: Comment[];
  onEdit?: (commentId: string, newContent: string) => void;
  onDelete?: (commentId: string) => void;
}

export default function CommentList({ comments, onEdit, onDelete }: CommentListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  };

  const handleEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const handleSave = (commentId: string) => {
    if (onEdit) {
      onEdit(commentId, editContent);
    }
    setEditingId(null);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditContent('');
  };

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div key={comment.id} className="border rounded-lg p-4 bg-gray-50">
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="font-semibold">{comment.author.name}</span>
              <span className="text-sm text-gray-500 ml-2">{getTimeAgo(comment.createdAt)}</span>
            </div>
            <div className="space-x-2">
              {editingId !== comment.id && (
                <>
                  <button onClick={() => handleEdit(comment)} className="text-blue-600 hover:text-blue-800 text-sm">
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete && onDelete(comment.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>

          {editingId === comment.id ? (
            <div>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-2 border rounded"
                rows={3}
              />
              <div className="mt-2 space-x-2">
                <button onClick={() => handleSave(comment.id)} className="bg-blue-500 text-white px-3 py-1 rounded">
                  Save
                </button>
                <button onClick={handleCancel} className="bg-gray-300 px-3 py-1 rounded">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-700">{comment.content}</p>
          )}

          {comment.updatedAt !== comment.createdAt && (
            <p className="text-xs text-gray-400 mt-2">(edited {getTimeAgo(comment.updatedAt)})</p>
          )}
        </div>
      ))}
    </div>
  );
}
