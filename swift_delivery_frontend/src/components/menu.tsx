import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchCafeteriaDetails } from '../services/api.ts';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/menu.scss';
import Header from './Header';
import SearchField from './SearchField';
import clockOutlineIcon from '../assets/ClockOutline2.svg';
import favoriteIcon from '../assets/heart2.svg';
import starIcon from '../assets/Star.svg';
import arrowForwardIcon from '../assets/arrow_forward_ios.svg';
import trashIcon from '../assets/TrashOutline.svg';
import duplicateIcon from '../assets/duplicate.svg';

interface MenuItem {
  id: number;
  name: string;
  price: number | string;
  available: boolean;
  category_name?: string;
  image?: string | null;
}

interface PackItem {
  menuItem: MenuItem;
  quantity: number;
}

interface Pack {
  id: number;
  items: PackItem[];
}

interface CafeteriaDetails {
  id: number;
  name: string;
  image: string | null;
  menu_items: MenuItem[];
}

const formatPrice = (price: number | string) => `₦${Number(price).toLocaleString()}`;

const packSubtotal = (pack: Pack) =>
  pack.items.reduce((sum, pi) => sum + Number(pi.menuItem.price) * pi.quantity, 0);

// ── Cart Panel ────────────────────────────────────────────────────────────────

interface CartPanelProps {
  packs: Pack[];
  editingPackId: number | null;
  onSetEditingPack: (id: number) => void;
  onUpdateQuantity: (packId: number, itemId: number, delta: number) => void;
  onDuplicatePack: (packId: number) => void;
  onDeletePack: (packId: number) => void;
  onAddPack: () => void;
  onClearCart: () => void;
  onCheckout: () => void;
}

const CartPanel: React.FC<CartPanelProps> = ({
  packs,
  editingPackId,
  onSetEditingPack,
  onUpdateQuantity,
  onDuplicatePack,
  onDeletePack,
  onAddPack,
  onClearCart,
  onCheckout,
}) => {
  const total = packs.reduce((sum, pack) => sum + packSubtotal(pack), 0);

  return (
    <aside className="cart-panel">
      <h2 className="cart-panel__title">Cart</h2>

      <div className="cart-panel__tabs">
        <button type="button" className="cart-panel__tab cart-panel__tab--active">
          Delivery
        </button>
      </div>

      <div className="cart-panel__body">
        {packs.length === 0 ? (
          <p className="cart-panel__empty">Your cart is empty. Add items to get started.</p>
        ) : (
          packs.map((pack, index) => (
            <div key={pack.id} className="cart-pack">
              <div className="cart-pack__header">
                <div>
                  <p className="cart-pack__name">Pack {index + 1}</p>
                  {editingPackId === pack.id ? (
                    <span className="cart-pack__editing">Currently editing</span>
                  ) : (
                    <button
                      type="button"
                      className="cart-pack__edit-btn"
                      onClick={() => onSetEditingPack(pack.id)}
                    >
                      Click to edit
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  className="cart-pack__delete-btn"
                  onClick={() => onDeletePack(pack.id)}
                  aria-label={`Delete pack ${index + 1}`}
                >
                  <img src={trashIcon} alt="" aria-hidden="true" />
                </button>
              </div>

              {pack.items.map((pi) => (
                <div key={pi.menuItem.id} className="cart-pack__item">
                  <div className="cart-pack__item-info">
                    <p className="cart-pack__item-name">{pi.menuItem.name}</p>
                    <p className="cart-pack__item-price">{formatPrice(pi.menuItem.price)}</p>
                  </div>
                  <div className="cart-pack__qty">
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(pack.id, pi.menuItem.id, -1)}
                      aria-label="Decrease"
                    >
                      -
                    </button>
                    <span>{pi.quantity}</span>
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(pack.id, pi.menuItem.id, 1)}
                      aria-label="Increase"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                className="cart-pack__duplicate-btn"
                onClick={() => onDuplicatePack(pack.id)}
              >
                <img src={duplicateIcon} alt="" aria-hidden="true" />
                Duplicate pack
              </button>
            </div>
          ))
        )}

        {packs.length > 0 && (
          <>
            <button type="button" className="cart-panel__add-pack-btn" onClick={onAddPack}>
              + Add pack
            </button>

            <button type="button" className="cart-panel__clear-btn" onClick={onClearCart}>
              <img src={trashIcon} alt="" aria-hidden="true" />
              Clear cart
            </button>

            <div className="cart-panel__note">
              <button type="button" className="cart-panel__note-btn">
                □ Leave a note for the vendor
                <span>Any requests, special vendor instructions etc.</span>
              </button>
              <span className="cart-panel__note-arrow">›</span>
            </div>

            <div className="cart-panel__subtotal">
              <span>Subtotal</span>
              <span>{formatPrice(total)}</span>
            </div>

            <button type="button" className="cart-panel__checkout-btn" onClick={onCheckout}>
              Continue to checkout
            </button>
          </>
        )}
      </div>
    </aside>
  );
};

// ── Menu ─────────────────────────────────────────────────────────────────────

const Menu: React.FC = () => {
  const { cafeteriaId } = useParams<{ cafeteriaId: string }>();
  const [cafeteria, setCafeteria] = useState<CafeteriaDetails | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [packs, setPacks] = useState<Pack[]>([]);
  const [editingPackId, setEditingPackId] = useState<number | null>(null);
  const [nextPackId, setNextPackId] = useState(1);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const categorySectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // ── Load cafeteria ──────────────────────────────────────────────────────────
  useEffect(() => {
    const getCafeteriaData = async () => {
      if (cafeteriaId === undefined) return;
      const numericId = Number(cafeteriaId);
      if (Number.isNaN(numericId)) return;
      try {
        const data = await fetchCafeteriaDetails(numericId);
        setCafeteria(data);
        setMenuItems(data.menu_items ?? []);
      } catch (error) {
        console.error('Error fetching cafeteria details:', error);
      }
    };
    getCafeteriaData();
  }, [cafeteriaId]);

  // ── Persist cart ────────────────────────────────────────────────────────────
  useEffect(() => {
    // Flatten packs into legacy cart format for Header cart count
    const flatCart = packs.flatMap((pack) =>
      pack.items.map((pi) => ({ ...pi.menuItem, quantity: pi.quantity }))
    );
    localStorage.setItem('cart', JSON.stringify(flatCart));
    window.dispatchEvent(new Event('storage'));
  }, [packs]);

  // ── Categories ──────────────────────────────────────────────────────────────
  const categories = Array.from(
    new Set(menuItems.map((item) => item.category_name || 'Uncategorized'))
  );

  const visibleSections = categories
    .map((category) => ({
      category,
      items: menuItems.filter((item) => {
        const cat = item.category_name || 'Uncategorized';
        return cat === category && item.name.toLowerCase().includes(searchQuery.toLowerCase());
      }),
    }))
    .filter((s) => s.items.length > 0);

  const visibleCategoryNames = visibleSections.map((s) => s.category);
  const tabCategories = searchQuery.trim() ? visibleCategoryNames : categories;

  useEffect(() => {
    if (tabCategories.length > 0 && !tabCategories.includes(activeCategory)) {
      setActiveCategory(tabCategories[0]);
    }
    if (tabCategories.length === 0 && activeCategory !== '') setActiveCategory('');
  }, [tabCategories, activeCategory]);

  useEffect(() => {
    if (visibleCategoryNames.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top));
        const cat = visible[0]?.target.getAttribute('data-category');
        if (cat) setActiveCategory(cat);
      },
      { rootMargin: '-18% 0px -62% 0px', threshold: [0.15, 0.3, 0.5] }
    );
    const nodes = visibleCategoryNames
      .map((cat) => categorySectionRefs.current[cat])
      .filter((n): n is HTMLElement => Boolean(n));
    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, [visibleCategoryNames.join('|')]);

  const handleTabClick = (category: string) => {
    setActiveCategory(category);
    categorySectionRefs.current[category]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // ── Cart actions ────────────────────────────────────────────────────────────
  const getOrCreateEditingPack = (): { packId: number; isNew: boolean } => {
    if (editingPackId !== null && packs.some((p) => p.id === editingPackId)) {
      return { packId: editingPackId, isNew: false };
    }
    const newId = nextPackId;
    setNextPackId((n) => n + 1);
    setPacks((prev) => [...prev, { id: newId, items: [] }]);
    setEditingPackId(newId);
    return { packId: newId, isNew: true };
  };

  const handleAddToCart = (item: MenuItem) => {
    if (!item.available) return;

    const { packId } = getOrCreateEditingPack();

    setPacks((prev) =>
      prev.map((pack) => {
        if (pack.id !== packId) return pack;
        const existing = pack.items.find((pi) => pi.menuItem.id === item.id);
        if (existing) {
          return {
            ...pack,
            items: pack.items.map((pi) =>
              pi.menuItem.id === item.id ? { ...pi, quantity: pi.quantity + 1 } : pi
            ),
          };
        }
        return { ...pack, items: [...pack.items, { menuItem: item, quantity: 1 }] };
      })
    );

    setAlertMessage(`${item.name} added to cart!`);
    window.setTimeout(() => setAlertMessage(null), 2500);
  };

  const handleUpdateQuantity = (packId: number, itemId: number, delta: number) => {
    setPacks((prev) =>
      prev.map((pack) => {
        if (pack.id !== packId) return pack;
        const updated = pack.items
          .map((pi) =>
            pi.menuItem.id === itemId ? { ...pi, quantity: pi.quantity + delta } : pi
          )
          .filter((pi) => pi.quantity > 0);
        return { ...pack, items: updated };
      }).filter((pack) => pack.items.length > 0 || pack.id === editingPackId)
    );
  };

  const handleDuplicatePack = (packId: number) => {
    const source = packs.find((p) => p.id === packId);
    if (!source) return;
    const newId = nextPackId;
    setNextPackId((n) => n + 1);
    setPacks((prev) => [...prev, { id: newId, items: source.items.map((pi) => ({ ...pi })) }]);
    setEditingPackId(newId);
  };

  const handleDeletePack = (packId: number) => {
    setPacks((prev) => prev.filter((p) => p.id !== packId));
    if (editingPackId === packId) setEditingPackId(null);
  };

  const handleAddPack = () => {
    const newId = nextPackId;
    setNextPackId((n) => n + 1);
    setPacks((prev) => [...prev, { id: newId, items: [] }]);
    setEditingPackId(newId);
  };

  const handleClearCart = () => {
    setPacks([]);
    setEditingPackId(null);
  };

  const handleCheckout = () => {
    window.location.href = '/checkout';
  };

  const cartIsOpen = packs.length > 0;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <main className="menu-screen">
      <div className="menu-screen__header-shell">
        <Header />
      </div>

      <section className={`menu-layout${cartIsOpen ? ' menu-layout--cart-open' : ''}`}>
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
              <img src={arrowForwardIcon} alt="" className="menu-hero__rating-arrow" aria-hidden="true" />
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
                      ref={(node) => { categorySectionRefs.current[section.category] = node; }}
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
                                  <p className="menu-card__price">{formatPrice(item.price)}</p>
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
                                    +
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    className="menu-card__action menu-card__action--disabled"
                                    aria-label={`${item.name} is unavailable`}
                                    disabled
                                  >
                                    🔔
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

        {cartIsOpen && (
          <CartPanel
            packs={packs}
            editingPackId={editingPackId}
            onSetEditingPack={setEditingPackId}
            onUpdateQuantity={handleUpdateQuantity}
            onDuplicatePack={handleDuplicatePack}
            onDeletePack={handleDeletePack}
            onAddPack={handleAddPack}
            onClearCart={handleClearCart}
            onCheckout={handleCheckout}
          />
        )}
      </section>
    </main>
  );
};

export default Menu;
