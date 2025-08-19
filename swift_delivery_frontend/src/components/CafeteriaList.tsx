import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchCafeterias } from '../services/api.ts';  
import '../styles/CafeteriaList.scss';
import 'bootstrap-icons/font/bootstrap-icons.css';
import Header from './Header';
import Footer from './Footer';

interface Cafeteria {
  id: number;
  name: string;
  image: string | null; 
}

const CafeteriaList: React.FC = () => {
  const [cafeterias, setCafeterias] = useState<Cafeteria[]>([]);
  const [filteredCafeterias, setFilteredCafeterias] = useState<Cafeteria[]>([]);

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

  const handleSearch = (query: string) => {
    const lowerCaseQuery = query.toLowerCase();
    const filtered = cafeterias.filter((cafeteria) =>
      cafeteria.name.toLowerCase().includes(lowerCaseQuery)
    );
    setFilteredCafeterias(filtered);
  };

  return (
    <div className="container">
      <Header onSearch={handleSearch}/>
      <h1 id="cafeteria-title">Cafeterias</h1>
      <ul className="cafeteria-list">
        {filteredCafeterias.map((cafeteria) => (
          <li key={cafeteria.id} className="cafeteria-container">
            <div>
              {cafeteria.image && <img src={cafeteria.image} alt={cafeteria.name} />}
              <br />
              <div className="cafeteria-name">
                <strong>{cafeteria.name}</strong>
                <div id="arrow-icon">
                  <Link to={`/cafeteria/${cafeteria.id}`}>
                    <i className="bi bi-arrow-right-circle-fill"></i>
                  </Link>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <Footer/>
    </div>
  );
};

export default CafeteriaList;