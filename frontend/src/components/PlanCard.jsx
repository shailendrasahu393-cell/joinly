import { useNavigate } from 'react-router-dom'
import { MapPin, Clock, Users, Trash2 } from 'lucide-react'
import UserAvatar from './UserAvatar'
import { getCategoryById, formatDate, formatTime } from '../utils/constants'

export default function PlanCard({ plan, showHost = true, onDelete }) {
    const navigate = useNavigate()
    const cat = getCategoryById(plan.category)
    const spotsLeft = (plan.maxParticipants || 5) - (plan.participantCount || 0)

    return (
        <div className="card plan-card" onClick={() => navigate(`/plans/${plan.id}`)}>
            <div className={`category-badge cat-${plan.category}`}>
                {cat.emoji} {cat.label}
            </div>

            <h3 className="plan-title">{plan.title}</h3>

            {showHost && plan.host && (
                <div className="plan-host">
                    <UserAvatar src={plan.host.profileImage} name={plan.host.fullName} size={28} />
                    <div>
                        <span className="host-name">{plan.host.fullName}</span>
                        {plan.host.username && (
                            <span className="host-username">@{plan.host.username}</span>
                        )}
                    </div>
                </div>
            )}

            <div className="plan-meta">
                <div className="plan-meta-item">
                    <MapPin size={14} />
                    <span>{[plan.locationName, plan.area, plan.city].filter(Boolean).join(' · ')}</span>
                </div>
                <div className="plan-meta-item">
                    <Clock size={14} />
                    <span>{formatDate(plan.date)} · {formatTime(plan.startTime)}</span>
                </div>
                <div className="plan-meta-item">
                    <Users size={14} />
                    <span>
                        {plan.participantCount || 0} / {plan.maxParticipants || 5} joined
                        {spotsLeft > 0 && <span className="spots-left"> · {spotsLeft} spots left</span>}
                    </span>
                </div>
            </div>

              {onDelete && (
                <button
                  type="button"
                  className="plan-delete-button"
                  onClick={(event) => {
                    event.stopPropagation()
                    onDelete(plan)
                  }}
                  aria-label={`Delete ${plan.title}`}
                  title="Delete plan"
                >
                  <Trash2 size={16} />
                </button>
              )}

            <style>{`
        .plan-card {
          position: relative;
          cursor: pointer;
          transition: all 0.2s;
        }
        .plan-card:active { transform: scale(0.98); }

        .plan-title {
          font-size: 17px;
          font-weight: 700;
          margin: 10px 0 8px;
          color: var(--color-text);
          line-height: 1.3;
        }

        .plan-host {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .host-name {
          font-size: 13px;
          font-weight: 600;
          color: var(--color-text);
        }

        .host-username {
          font-size: 12px;
          color: var(--color-text-secondary);
          margin-left: 4px;
        }

        .plan-meta {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .plan-meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: var(--color-text-secondary);
        }

        .spots-left { color: var(--color-primary); font-weight: 500; }

        .plan-delete-button {
          position: absolute;
          top: 14px;
          right: 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border: 1px solid color-mix(in srgb, var(--color-danger) 25%, var(--color-border));
          border-radius: var(--radius-sm);
          background: var(--color-surface);
          color: var(--color-danger);
          cursor: pointer;
        }

        .plan-delete-button:hover { background: color-mix(in srgb, var(--color-danger) 8%, white); }
      `}</style>
        </div>
    )
}
