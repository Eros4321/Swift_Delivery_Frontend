import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchCafeterias } from '../services/api.ts';
import '../styles/CafeteriaList.scss';
import Header from './Header';

import filterIcon from '../assets/filter.svg';
import starIcon from '../assets/Star.svg';
import clockIcon from '../assets/ClockOutline.svg';

// Category icons
import iconBrowseAll from '../assets/noto_shopping-bags.svg';
import iconCafeterias from '../assets/fa6-solid_house.svg';
import iconGrillz from '../assets/streamline-ultimate-color_barbecue-grill.svg';
import iconPastries from '../assets/noto_cupcake.svg';
import iconDrinks from '../assets/noto-v1_wine-glass.svg';

interface Cafeteria {
  id: number;
  name: string;
  image: string | null;
}

interface CategoryCard {
  label: string;
  icon: string;
  key: 'browse-all' | 'cafeterias' | 'grillz' | 'pastries' | 'drinks';
}

const categoryCards: CategoryCard[] = [
  { label: 'Browse All', icon: iconBrowseAll, key: 'browse-all' },
  { label: 'Cafeterias', icon: iconCafeterias, key: 'cafeterias' },
  { label: 'Grillz', icon: iconGrillz, key: 'grillz' },
  { label: 'Pastries', icon: iconPastries, key: 'pastries' },
  { label: 'Drinks', icon: iconDrinks, key: 'drinks' },
];

const CafeteriaList: React.FC = () => {
  const [cafeterias, setCafeterias] = useState<Cafeteria[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCafeterias, setFilteredCafeterias] = useState<Cafeteria[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('browse-all');

  useEffect(() => {
    const getCafeterias = async () => {
      try {
        const data = await fetchCafeterias();
        setCafeterias(data);
        setFilteredCafeterias(data);
      } catch (error) {
        console.error('Error fetching cafeterias:', error);
      }
    };

    getCafeterias();
  }, []);

  const handleCategoryClick = (key: string) => {
    if (key === 'browse-all') {
      setSelectedCategory(key);
    }
  };

  useEffect(() => {
    const lowerCaseQuery = searchQuery.trim().toLowerCase();
    const filtered = cafeterias.filter((cafeteria) =>
      cafeteria.name.toLowerCase().includes(lowerCaseQuery)
    );
    setFilteredCafeterias(filtered);
  }, [cafeterias, searchQuery]);

  return (
    <main className="cafeteria-screen">
      <div className="cafeteria-sticky">
        <Header searchQuery={searchQuery} onSearch={setSearchQuery} />
      </div>

      <section className="cafeteria-content">
        <div className="cafeteria-content__intro">
          <h1>Explore Categories</h1>
        </div>

        <div className="cafeteria-categories" aria-label="Explore categories">
          {categoryCards.map((category) => (
            <div
              key={category.label}
              className={`cafeteria-category cafeteria-category--${category.key}${selectedCategory === category.key ? ' is-active' : ''}`}
              onClick={() => handleCategoryClick(category.key)}
              role="button"
              aria-pressed={selectedCategory === category.key}
            >
              <img src={category.icon} alt="" aria-hidden="true" className="cafeteria-category__icon" />
              <span>{category.label}</span>
            </div>
          ))}
        </div>

        <button type="button" className="cafeteria-filter" aria-label="Filter cafeterias">
          <span>Filter</span>
          <img src={filterIcon} alt="" className="cafeteria-filter__icon" aria-hidden="true" />
        </button>

        {filteredCafeterias.length > 0 ? (
          <ul className="cafeteria-grid">
            {filteredCafeterias.map((cafeteria) => (
              <li key={cafeteria.id} className="cafeteria-grid__item">
                <Link to={`/cafeteria/${cafeteria.id}`} className="cafeteria-card">
                  <div className="cafeteria-card__image-shell">
                    {cafeteria.image ? (
                      <img src={cafeteria.image} alt={cafeteria.name} className="cafeteria-card__image" />
                    ) : (
                      <div className="cafeteria-card__image-placeholder">
                        <i className="bi bi-shop-window" aria-hidden="true"></i>
                      </div>
                    )}
                  </div>

                  <div className="cafeteria-card__body">
                    <div className="cafeteria-card__heading">
                      <h2>{cafeteria.name}</h2>

                      <div className="cafeteria-card__rating">
                        <span>4.3</span>
                        <img src={starIcon} alt="" className="cafeteria-card__icon" aria-hidden="true" />
                      </div>
                    </div>

                    <div className="cafeteria-card__meta">
                      <img src={clockIcon} alt="" className="cafeteria-card__icon" aria-hidden="true" />
                      <span>30-45 mins</span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="cafeteria-empty-state">
            <h2>No cafeterias match your search.</h2>
            <p>Try a different name or clear the search to browse all available spots.</p>
          </div>
        )}
      </section>
    </main>
  );
};

export default CafeteriaList;
