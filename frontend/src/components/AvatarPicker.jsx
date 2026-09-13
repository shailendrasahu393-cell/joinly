import { AVATAR_OPTIONS } from '../utils/constants'
import UserAvatar from './UserAvatar'

export default function AvatarPicker({ value, onChange }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {['male', 'female'].map((gender) => (
                <div key={gender}>
                    <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, textTransform: 'capitalize' }}>
                        {gender} avatars
                    </p>
                    <div style={{ display: 'flex', gap: 14 }}>
                        {AVATAR_OPTIONS.filter((avatar) => avatar.gender === gender).map((avatar) => (
                            <button
                                key={avatar.id}
                                type="button"
                                onClick={() => onChange(avatar.url)}
                                aria-label={`Choose ${avatar.label}`}
                                style={{
                                    padding: 3,
                                    border: value === avatar.url ? '3px solid var(--color-primary)' : '3px solid transparent',
                                    borderRadius: '50%',
                                    background: 'none',
                                    cursor: 'pointer',
                                }}
                            >
                                <UserAvatar src={avatar.url} name={avatar.label} size={64} />
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}
