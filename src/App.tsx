import { useState, Fragment } from 'react';
import {
  useQuery,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import {
  API_BASE,
  CHESS_TYPES,
  TOP_N_OPTIONS,
  HISTORY_MAX_DAYS_OPTIONS,
} from './constants';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false },
  },
});

type TopPlayersResponse = {
  users: {
    id: string;
    username: string;
    title?: string;
    online?: boolean;
    perfs: Record<string, { rating: number; progress: number }>;
  }[];
};

type UserRatingHistoryResponse = {
  name: string;
  points: [year: number, month: number, day: number, rating: number][];
}[];

function App() {
  const [chessType, setChessType] = useState(CHESS_TYPES[0]);
  const [topN, setTopN] = useState(TOP_N_OPTIONS[0]);
  const [activeUsername, setActiveUsername] = useState<string | null>(null);
  const [historyMaxDays, setHistoryMaxDays] = useState(
    HISTORY_MAX_DAYS_OPTIONS[0]
  );

  const {
    data: users,
    isLoading: isLoadingUsers,
    error: usersError,
  } = useQuery({
    queryKey: ['top-players', chessType, topN],
    queryFn: () =>
      fetch(`${API_BASE}player/top/${topN}/${chessType}`).then(
        (res) => res.json() as Promise<TopPlayersResponse>
      ),
    select: (data) => data.users,
  });

  const {
    data: userRatingHistory,
    isLoading: isLoadingUserRatingHistory,
    error: userRatingHistoryError,
  } = useQuery({
    queryKey: ['user-rating-history', activeUsername],
    queryFn: () =>
      fetch(`${API_BASE}user/${activeUsername}/rating-history`).then(
        (res) => res.json() as Promise<UserRatingHistoryResponse>
      ),
    enabled: !!activeUsername,
  });

  const renderTopPlayers = () => {
    if (isLoadingUsers) {
      return <div>Loading...</div>;
    }

    if (usersError) {
      return <div>Error: {usersError.message}</div>;
    }

    if (!users?.length) {
      return <div>Nothing found...</div>;
    }

    return (
      <>
        <div className="table-row table-header">
          <div>Username</div>
          <div>Online</div>
          <div>Rating</div>
          <div>Progress</div>
        </div>
        {users.map((p, i) => {
          return (
            <div
              key={p.id}
              className="table-row clickable"
              onClick={() => setActiveUsername(p.username)}
            >
              <div>
                {i + 1}. {p.username}
                {p.title ? ` (title - ${p.title})` : ''}
              </div>
              <div className={p.online ? 'online' : 'offline'}>
                {p.online ? 'Online' : 'Offline'}
              </div>
              <div>{p.perfs[chessType].rating}</div>
              <div>{p.perfs[chessType].progress}</div>
            </div>
          );
        })}
      </>
    );
  };

  const renderTopPlayersTable = () => {
    return (
      <>
        <label>
          <span>Chess Type:</span>
          <select
            value={chessType}
            onChange={(e) => setChessType(e.target.value)}
          >
            {CHESS_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Top N:</span>
          <select
            value={topN}
            onChange={(e) => setTopN(Number(e.target.value))}
          >
            {TOP_N_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <div className="table">{renderTopPlayers()}</div>
      </>
    );
  };

  const renderUserRatingHistory = () => {
    if (isLoadingUserRatingHistory) {
      return <div>Loading {activeUsername} Rating History...</div>;
    }

    if (userRatingHistoryError) {
      return (
        <div>
          Error loading {activeUsername} Rating History:{' '}
          {userRatingHistoryError.message}
        </div>
      );
    }

    if (!userRatingHistory?.length) {
      return <div>No rating history found for {activeUsername}</div>;
    }

    return (
      <>
        <h2>{activeUsername} Rating History</h2>
        {userRatingHistory.map((h) => {
          const points = h.points.slice(historyMaxDays * -1).reverse();

          return (
            <Fragment key={h.name}>
              <h3>GAME TYPE - {h.name}</h3>
              <div className="table-row table-header">
                <div>Rating</div>
                <div>Date</div>
                <div />
                <div />
              </div>
              {points.map((p) => {
                const [year, month, day, rating] = p;
                const key = `${h.name}-${year}-${month}-${day}-${rating}`;

                return (
                  <div key={key} className="table-row">
                    <div>{rating}</div>
                    <div>{`${month}/${day}/${year}`}</div>
                    <div />
                    <div />
                  </div>
                );
              })}
            </Fragment>
          );
        })}
      </>
    );
  };

  return (
    <div className="app">
      <h1>Athleas Take-Home Assignment</h1>
      {activeUsername ? (
        <>
          <button onClick={() => setActiveUsername(null)}>Back</button>
          <label>
            <span>History max last days shown:</span>
            <select
              value={historyMaxDays}
              onChange={(e) => setHistoryMaxDays(Number(e.target.value))}
            >
              {HISTORY_MAX_DAYS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>
          {renderUserRatingHistory()}
        </>
      ) : (
        renderTopPlayersTable()
      )}
    </div>
  );
}

function AppWrapper() {
  return (
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
}

export default AppWrapper;
