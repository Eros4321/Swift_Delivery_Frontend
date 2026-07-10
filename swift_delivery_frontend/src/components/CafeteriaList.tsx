import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchCafeterias } from '../services/api.ts';
import '../styles/CafeteriaList.scss';
import { ArrowRight } from 'lucide-react';

interface Cafeteria {
  id: number;
  name: string;
  image: string | null;
}

interface CafeteriaListProps {
  searchQuery?: string;
}

const CafeteriaList: React.FC<CafeteriaListProps> = ({ searchQuery = '' }) => {
  const [cafeterias, setCafeterias] = useState<Cafeteria[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getCafeterias = async () => {
      try {
        const data = await fetchCafeterias();
        setCafeterias(data);
      } catch (error) {
        console.error('Error fetching cafeterias:', error);
      } finally {
        setLoading(false);
      }
    };
    getCafeterias();
  }, []);

  const filtered = cafeterias.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Hero */}
      <section className="hero">
        <h1 className="hero-title">
          Order food from your<br />
          <span>favourite cafeteria</span>
        </h1>
        <p className="hero-subtitle">
          Browse cafeterias, pick your meal, and get it delivered straight to you — fast.
        </p>
      </section>

      {/* Cafeteria grid */}
      <section className="cafeteria-section">
        <div className="section-header">
          <h2 className="section-title">
            All <span>Cafeterias</span>
          </h2>
          {!loading && (
            <span className="section-count">
              {filtered.length} {filtered.length === 1 ? 'location' : 'locations'}
            </span>
          )}
        </div>

        {loading ? (
          <div className="cafeteria-loading">
            <div className="spinner" />
            <p>Finding cafeterias near you…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="cafeteria-empty">
            <span className="empty-icon">🍽️</span>
            <p>No cafeterias found</p>
            <small>Try a different search term</small>
          </div>
        ) : (
          <ul className="cafeteria-grid">
            {filtered.map((cafeteria) => (
              <li key={cafeteria.id}>
                <Link to={`/cafeteria/${cafeteria.id}`} className="cafeteria-card">
                  <div className="card-img">
                    {cafeteria.image ? (
                      <img src={cafeteria.image} alt={cafeteria.name} />
                    ) : (
                      <div className="card-img-placeholder">🍴</div>
                    )}
                  </div>
                  <div className="card-body">
                    <span className="card-name">{cafeteria.name}</span>
                    <span className="card-arrow">
                      <ArrowRight size={15} />
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
};

export default CafeteriaList;
