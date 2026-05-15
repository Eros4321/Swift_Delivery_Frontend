import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchCafeteriaDetails } from '../services/api.ts';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../styles/menu.scss';
import Header from './Header';
import SearchField from './SearchField';
import clockOutlineIcon from '../assets/ClockOutline2.svg';
import favoriteIcon from '../assets/heart2.svg';
import starIcon from '../assets/Star.svg';
import arrowForwardIcon from '../assets/arrow_forward_ios.svg';

interface MenuItem {
  id: number;
  name: string;
  price: number | string;
  available: boolean;
  category_name?: string;
  image?: string | null;
}

interface CartItem extends MenuItem {
  quantity: number;
}

interface CafeteriaDetails {
  id: number;
  name: string;
  image: string | null;
  menu_items: MenuItem[];
}

interface QuantitySelectorProps {
  quantity: number;
  onChange: (newQuantity: number) => void;
  min?: number;
  max?: number;
}

interface QuantityMap {
  [itemId: number]: number;
}

const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  quantity,
  onChange,
  min = 1,
  max = 10,
}) => {
  const handleIncrease = () => {
    if (quantity < max) {
      onChange(quantity + 1);
    }
  };

  const handleDecrease = () => {
    if (quantity > min) {
      onChange(quantity - 1);
    }
  };

  return (
    <div className="menu-quantity-selector">
      <button type="button" onClick={handleDecrease} aria-label="Reduce quantity">
        -
      </button>
      <span>{quantity}</span>
      <button type="button" onClick={handleIncrease} aria-label="Increase quantity">
        +
      </button>
    </div>
  );
};

const readCartFromStorage = () => {
  const savedCart = localStorage.getItem('cart');

  if (!savedCart) {
    return [];
  }

  try {
    const parsedCart = JSON.parse(savedCart);
    return Array.isArray(parsedCart) ? (parsedCart as CartItem[]) : [];
  } catch (error) {
    console.error('Error parsing saved cart:', error);
    return [];
  }
};

const formatPrice = (price: number | string) => `₦${Number(price).toLocaleString()}`;

const Menu: React.FC = () => {
  const { cafeteriaId } = useParams<{ cafeteriaId: string }>();
  const [cafeteria, setCafeteria] = useState<CafeteriaDetails | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [quantities, setQuantities] = useState<QuantityMap>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [cart, setCart] = useState<CartItem[]>(() => readCartFromStorage());
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const categorySectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const getCafeteriaData = async () => {
      if (cafeteriaId === undefined) {
        return;
      }

      const numericCafeteriaId = Number(cafeteriaId);

      if (Number.isNaN(numericCafeteriaId)) {
        return;
      }

      try {
        const data = await fetchCafeteriaDetails(numericCafeteriaId);
        setCafeteria(data);
        setMenuItems(data.menu_items ?? []);
      } catch (error) {
        console.error('Error fetching cafeteria details:', error);
      }
    };

    getCafeteriaData();

    const savedQuantities = localStorage.getItem('quantities');
    if (savedQuantities) {
      try {
        setQuantities(JSON.parse(savedQuantities));
      } catch (error) {
        console.error('Error parsing saved quantities:', error);
      }
    }
  }, [cafeteriaId]);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cart-updated'));
  }, [cart]);

  useEffect(() => {
    const syncCart = () => {
      setCart(readCartFromStorage());
    };

    window.addEventListener('storage', syncCart);
    window.addEventListener('focus', syncCart);

    return () => {
      window.removeEventListener('storage', syncCart);
      window.removeEventListener('focus', syncCart);
    };
  }, []);

  const categories = Array.from(
    new Set(menuItems.map((item) => item.category_name || 'Uncategorized'))
  );

  const visibleSections = categories
    .map((category) => ({
      category,
      items: menuItems.filter((item) => {
        const categoryName = item.category_name || 'Uncategorized';
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        return categoryName === category && matchesSearch;
      }),
    }))
    .filter((section) => section.items.length > 0);

  const visibleCategoryNames = visibleSections.map((section) => section.category);
  const tabCategories = searchQuery.trim() ? visibleCategoryNames : categories;

  useEffect(() => {
    if (tabCategories.length > 0 && !tabCategories.includes(activeCategory)) {
      setActiveCategory(tabCategories[0]);
    }

    if (tabCategories.length === 0 && activeCategory !== '') {
      setActiveCategory('');
    }
  }, [tabCategories, activeCategory]);

  useEffect(() => {
    if (visibleCategoryNames.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((first, second) => Math.abs(first.boundingClientRect.top) - Math.abs(second.boundingClientRect.top));

        const currentSection = visibleEntries[0];
        const currentCategory = currentSection?.target.getAttribute('data-category');

        if (currentCategory) {
          setActiveCategory(currentCategory);
        }
      },
      {
        rootMargin: '-18% 0px -62% 0px',
        threshold: [0.15, 0.3, 0.5],
      }
    );

    const nodes = visibleCategoryNames
      .map((category) => categorySectionRefs.current[category])
      .filter((node): node is HTMLElement => Boolean(node));

    nodes.forEach((node) => observer.observe(node));

    return () => {
      observer.disconnect();
    };
  }, [visibleCategoryNames.join('|')]);

  const handleQuantityChange = (itemId: number, quantity: number) => {
    setQuantities((prev) => {
      const updatedQuantities = { ...prev, [itemId]: quantity };
      localStorage.setItem('quantities', JSON.stringify(updatedQuantities));
      return updatedQuantities;
    });
  };

  const handleAddToCart = (item: MenuItem) => {
    if (!item.available) {
      return;
    }

    const quantity = quantities[item.id] ?? 1;

    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem.id === item.id);

      if (existingItem) {
        return prevCart.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + quantity }
            : cartItem
        );
      }

      return [...prevCart, { ...item, quantity }];
    });

    setAlertMessage(`${item.name} added to cart!`);
    window.setTimeout(() => setAlertMessage(null), 2500);
  };

  const handleTabClick = (category: string) => {
    setActiveCategory(category);
    categorySectionRefs.current[category]?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  return (
    <main className="menu-screen">
      <div className="menu-screen__header-shell">
        <Header />
      </div>

      <section className="menu-layout">
        <aside className="menu-sidebar">
          <nav className="menu-breadcrumbs" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <i className="bi bi-chevron-right" aria-hidden="true"></i>
            <span>Cafeterias</span>
          </nav>

          <div className="menu-hero">
            <div className="menu-hero__image-shell">
              {cafeteria?.image ? (
                <img src={cafeteria.image} alt={cafeteria.name} className="menu-hero__image" />
              ) : (
                <div className="menu-hero__placeholder">
                  <i className="bi bi-shop-window" aria-hidden="true"></i>
                </div>
              )}

              <div className="menu-hero__status-pill">
                <img src={clockOutlineIcon} alt="" className="menu-hero__status-icon" aria-hidden="true" />
                <span>30-45 mins</span>
              </div>

              <button type="button" className="menu-hero__favorite-btn" aria-label="Save cafeteria">
                <img src={favoriteIcon} alt="" className="menu-hero__favorite-icon" aria-hidden="true" />
              </button>
            </div>

            <h1>{cafeteria?.name || 'Loading cafeteria...'}</h1>

            <div className="menu-hero__rating-row">
              <div className="menu-hero__rating">
                <img src={starIcon} alt="" className="menu-hero__rating-star" aria-hidden="true" />
                <span>4.3</span>
                <small>(3.9k+)</small>
              </div>
              <img
                src={arrowForwardIcon}
                alt=""
                className="menu-hero__rating-arrow"
                aria-hidden="true"
              />
            </div>

            <p className="menu-hero__hours">OPEN UNTIL 08:00 PM</p>
          </div>
        </aside>

        <section className="menu-panel">
          {categories.length > 0 ? (
            <>
              <div className="menu-panel__controls">
                <SearchField
                  className="menu-panel__search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder={`Search ${cafeteria?.name || 'menu'}`}
                  ariaLabel="Search this cafeteria menu"
                />

                <div className="menu-tabs" role="tablist" aria-label="Menu categories">
                  {tabCategories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      role="tab"
                      className={`menu-tab${activeCategory === category ? ' is-active' : ''}`}
                      aria-selected={activeCategory === category}
                      onClick={() => handleTabClick(category)}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {alertMessage && (
                <div className="menu-toast" role="status" aria-live="polite">
                  {alertMessage}
                </div>
              )}

              {visibleSections.length > 0 ? (
                <div className="menu-sections">
                  {visibleSections.map((section) => (
                    <section
                      key={section.category}
                      ref={(node) => {
                        categorySectionRefs.current[section.category] = node;
                      }}
                      data-category={section.category}
                      className="menu-category-section"
                    >
                      <div className="menu-section-heading">
                        <h2>{section.category}</h2>
                      </div>

                      <ul className="menu-cards">
                        {section.items.map((item) => (
                          <li
                            key={item.id}
                            className={`menu-card${item.available ? '' : ' menu-card--unavailable'}`}
                          >
                            <div className="menu-card__content">
                              <div className="menu-card__details">
                                <h3>{item.name}</h3>

                                {item.available ? (
                                  <>
                                    <p className="menu-card__price">{formatPrice(item.price)}</p>
                                    <QuantitySelector
                                      quantity={quantities[item.id] ?? 1}
                                      min={1}
                                      max={10}
                                      onChange={(quantity) => handleQuantityChange(item.id, quantity)}
                                    />
                                  </>
                                ) : (
                                  <p className="menu-card__stock">Out of stock</p>
                                )}
                              </div>

                              <div className="menu-card__media">
                                {item.image ? (
                                  <img src={item.image} alt={item.name} className="menu-card__image" />
                                ) : (
                                  <div className="menu-card__placeholder">
                                    <i className="bi bi-image" aria-hidden="true"></i>
                                  </div>
                                )}

                                {item.available ? (
                                  <button
                                    type="button"
                                    className="menu-card__action"
                                    onClick={() => handleAddToCart(item)}
                                    aria-label={`Add ${item.name} to cart`}
                                  >
                                    <i className="bi bi-plus-lg" aria-hidden="true"></i>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    className="menu-card__action menu-card__action--disabled"
                                    aria-label={`${item.name} is unavailable`}
                                    disabled
                                  >
                                    <i className="bi bi-bell" aria-hidden="true"></i>
                                  </button>
                                )}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
              ) : (
                <div className="menu-empty-state">
                  <h3>No items match this search.</h3>
                  <p>Try a different keyword or switch to another category.</p>
                </div>
              )}
            </>
          ) : (
            <div className="menu-empty-state">
              <h3>No menu items available for this cafeteria.</h3>
              <p>Check back later for new dishes and category updates.</p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
};

export default Menu;
