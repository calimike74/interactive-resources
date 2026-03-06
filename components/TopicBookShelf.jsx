'use client';

import TopicBook from './TopicBook';
import { spacing, typography, theme } from '@/lib/theme';

export default function TopicBookShelf({ topics }) {
    const t = theme.light;

    return (
        <section style={{ width: '100%' }}>
            <div
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    gap: spacing[8],
                    padding: `${spacing[6]} ${spacing[4]}`,
                    paddingBottom: spacing[2],
                }}
            >
                {topics.map((topic, i) => (
                    <TopicBook
                        key={topic.id}
                        topic={topic}
                        animationDelay={i * 60}
                    />
                ))}
            </div>

            {/* Shelf surface */}
            <div
                style={{
                    width: '100%',
                    height: 6,
                    background: `linear-gradient(to bottom, ${t.border.subtle}, transparent)`,
                    borderRadius: '0 0 4px 4px',
                    marginTop: spacing[1],
                }}
                aria-hidden="true"
            />
            <div
                style={{
                    width: '92%',
                    height: 10,
                    margin: '0 auto',
                    background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.08) 0%, transparent 70%)',
                    filter: 'blur(4px)',
                }}
                aria-hidden="true"
            />
        </section>
    );
}
