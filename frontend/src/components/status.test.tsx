import { render, screen } from '@testing-library/react';
import { Flag } from '@/lib/api';
import { EnvTag, RolloutMeter, StatusPill, StrategyBadge } from './status';

function flag(partial: Partial<Flag>): Flag {
  return {
    id: 'f1',
    key: 'demo',
    enabled: false,
    strategy: 'BOOLEAN',
    rolloutPercentage: 0,
    version: 1,
    environmentKey: 'DEV',
    updatedAt: new Date().toISOString(),
    ...partial,
  } as Flag;
}

describe('StatusPill', () => {
  it('shows Off when the flag is disabled', () => {
    render(<StatusPill flag={flag({ enabled: false })} />);
    expect(screen.getByText('Off')).toBeInTheDocument();
  });

  it('shows On for an enabled boolean flag', () => {
    render(<StatusPill flag={flag({ enabled: true, strategy: 'BOOLEAN' })} />);
    expect(screen.getByText('On')).toBeInTheDocument();
  });

  it('shows the rollout percentage for an enabled percentage flag', () => {
    render(
      <StatusPill flag={flag({ enabled: true, strategy: 'PERCENTAGE_ROLLOUT', rolloutPercentage: 20 })} />,
    );
    expect(screen.getByText('Rollout 20%')).toBeInTheDocument();
  });
});

describe('RolloutMeter / StrategyBadge / EnvTag', () => {
  it('renders the rollout percentage label', () => {
    render(<RolloutMeter percentage={45} />);
    expect(screen.getByText('45%')).toBeInTheDocument();
  });

  it('labels the strategy in short form', () => {
    render(<StrategyBadge strategy="PERCENTAGE_ROLLOUT" />);
    expect(screen.getByText('PERCENT')).toBeInTheDocument();
  });

  it('uppercases the environment key', () => {
    render(<EnvTag env="prod" />);
    expect(screen.getByText('PROD')).toBeInTheDocument();
  });
});
