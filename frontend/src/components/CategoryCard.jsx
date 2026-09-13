import { useNavigate } from 'react-router-dom'

export default function CategoryCard({ category, onClick }) {
    return (
        <button
            className="category-card"
            onClick={() => onClick?.(category.id)}
        >
            <span className="cat-emoji">{category.emoji}</span>
            <span className="cat-label">{category.label}</span>

            <style>{`
        .category-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 14px 12px;
          min-width: 72px;
          border-radius: var(--radius-lg);
          border: 1.5px solid var(--color-border-light);
          background: var(--color-surface);
          cursor: pointer;
          transition: all 0.2s;
        }

        .category-card:hover {
          border-color: var(--color-primary-light);
          background: color-mix(in srgb, var(--color-primary) 5%, transparent);
          transform: translateY(-2px);
          box-shadow: var(--shadow-sm);
        }

        .category-card:active { transform: scale(0.95); }

        .cat-emoji { font-size: 24px; }
        .cat-label {
          font-size: 11px;
          font-weight: 600;
          color: var(--color-text-secondary);
        }
      `}</style>
        </button>
    )
}
