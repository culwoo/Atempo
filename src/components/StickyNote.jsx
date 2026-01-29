import React from 'react';
import { motion } from 'framer-motion';
import classes from './StickyNote.module.css';

import { X, Pencil } from 'lucide-react';

const StickyNote = ({ post, isMine, canDelete, onDelete, onEdit }) => {
    // post: { content, from, toName[], color, timestamp }

    // Random slight rotation for natural look (stable based on content length or id if real)
    const rotation = Math.random() * 6 - 3;

    return (
        <motion.div
            className={classes.note}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.05, zIndex: 10, transition: { duration: 0.2 } }}
            style={{
                backgroundColor: post.color || '#FFF9B0',
                rotate: rotation,
                border: isMine ? '2px solid var(--primary-color)' : 'none'
            }}
        >
            {(isMine || canDelete) && (
                <div className={classes.actions}>
                    {isMine && (
                        <button className={classes.actionBtn} onClick={(e) => {
                            e.stopPropagation();
                            onEdit();
                        }} title="수정">
                            <Pencil size={14} />
                        </button>
                    )}
                    <button className={classes.actionBtn} onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }} title="삭제">
                        <X size={14} />
                    </button>
                </div>
            )}
            <div className={classes.header}>
                <span className={classes.from}>From. {post.from}</span>
                {post.isPublic ? (
                    <span className={classes.badgePublic}>전체</span>
                ) : (
                    <span className={classes.badgePrivate}>To. {post.toNames?.join(', ')}</span>
                )}
            </div>
            <p className={classes.content}>{post.content}</p>
            <div className={classes.footer}>
                {new Date(post.createdAt).toLocaleDateString()}
            </div>
        </motion.div>
    );
};

export default StickyNote;
