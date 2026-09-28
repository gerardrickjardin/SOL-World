import React, { useState } from 'react';

/**
 * SOL REViBE MindBody Wellness Station Customer Checkout & Warranty Registration
 * Designed for Next.js / React single-page direct checkout.
 */
export default function CheckoutPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: 'United States',
    sameAsShipping: true,
    billingAddress: '',
    billingCity: '',
    billingState: '',
    billingZip: '',
    governmentId: '',
    cardholderName: '',
    cardNumber: '',
    cardExp: '',
    cardCvc: '',
  });

  const [pricingPlan, setPricingPlan] = useState('full'); // 'full' ($2,495) | 'split' ($2,500 total, $1,250 now)
  const [cardType, setCardType] = useState('visa');
  const [paymentState, setPaymentState] = useState({
    isProcessing: false,
    isSuccess: false,
    error: null,
    transactionId: null,
    orderId: null,
  });

  const [activeModal, setActiveModal] = useState(null);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleCardNumberChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.startsWith('3')) setCardType('amex');
    else if (val.startsWith('5') || val.startsWith('2')) setCardType('mastercard');
    else if (val.startsWith('6')) setCardType('discover');
    else setCardType('visa');

    let formatted = '';
    for (let i = 0; i < val.length && i < 16; i++) {
      if (i > 0 && i % 4 === 0) formatted += ' ';
      formatted += val[i];
    }
    setFormData((prev) => ({ ...prev, cardNumber: formatted }));
  };

  const handleExpChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length >= 2) {
      val = val.substring(0, 2) + ' / ' + val.substring(2, 4);
    }
    setFormData((prev) => ({ ...prev, cardExp: val }));
  };

  const handlePhoneChange = (e) => {
    let x = e.target.value.replace(/\D/g, '').match(/(\d{0,3})(\d{0,3})(\d{0,4})/);
    const formatted = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
    setFormData((prev) => ({ ...prev, phone: formatted }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setPaymentState({ isProcessing: true, isSuccess: false, error: null, transactionId: null, orderId: null });

    setTimeout(() => {
      const mockTx = 'TXN_' + Math.random().toString(36).substring(2, 10).toUpperCase();
      const mockOrder = 'SR-' + Math.floor(100000 + Math.random() * 900000);
      setPaymentState({
        isProcessing: false,
        isSuccess: true,
        error: null,
        transactionId: mockTx,
        orderId: mockOrder,
      });
    }, 1600);
  };

  const currentPrice = pricingPlan === 'full' ? '2,495' : '1,250';
  const totalDisplay = pricingPlan === 'full' ? '$2,495.00 USD' : '$1,250.00 USD (Installment 1 of 2 • $2,500 Total)';

  return (
    <div className="checkout-page-root">
      <div className="bg-decor-blob blob-1"></div>
      <div className="bg-decor-blob blob-2"></div>

      <main className="checkout-main-container">
        <header className="brand-header">
          <img
            src="assets/SOL REViBE Logo.png"
            alt="SOL REViBE"
            className="brand-logo"
            onError={(e) => {
              e.target.style.display = 'none';
              if (e.target.nextSibling) e.target.nextSibling.style.display = 'block';
            }}
          />
          <h1 className="brand-fallback-text" style={{ display: 'none' }}>
            SOL REViBE
          </h1>
        </header>

        <div className="secure-badge-wrapper">
          <div className="secure-badge">
            <svg className="badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            <span>Secure Checkout & Device Warranty Portal</span>
          </div>
        </div>

        <div className="checkout-card">
          {paymentState.isSuccess ? (
            <div className="confirmation-screen">
              <div className="success-icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2>Order Confirmed & Warranty Registered!</h2>
              <p className="conf-subtitle">
                Thank you, <strong>{formData.fullName || 'Valued Customer'}</strong>. Your order for the{' '}
                <strong>SOL REViBE MindBody Wellness Station (P90 Plus Complete Package)</strong> has been successfully placed.
              </p>

              <div className="token-details-box">
                <div className="token-row">
                  <span>Order Reference #:</span>
                  <code>{paymentState.orderId}</code>
                </div>
                <div className="token-row">
                  <span>Official 1-Year Warranty:</span>
                  <strong style={{ color: '#059669' }}>
                    ACTIVE (Registered to ID: {formData.governmentId ? '••••' + formData.governmentId.slice(-4) : '••••8412'})
                  </strong>
                </div>
                <div className="token-row">
                  <span>Total Amount:</span>
                  <strong>{totalDisplay}</strong>
                </div>
                <div className="token-row">
                  <span>Delivery Address:</span>
                  <strong>
                    {formData.address}, {formData.city}, {formData.state} {formData.zip}
                  </strong>
                </div>
                <div className="token-row">
                  <span>Confirmation Sent To:</span>
                  <strong>{formData.email || 'customer@wellness.com'}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="reset-btn"
                  onClick={() => window.print()}
                  style={{ backgroundColor: '#0F172A', color: '#fff', border: 'none' }}
                >
                  Print Order & Warranty Receipt
                </button>
                <button
                  type="button"
                  className="reset-btn"
                  onClick={() =>
                    setPaymentState({ isProcessing: false, isSuccess: false, error: null, transactionId: null, orderId: null })
                  }
                >
                  Return to Order Form
                </button>
              </div>
            </div>
          ) : (
            <div className="checkout-grid">
              {/* Left Column: Product Overview & Bundle */}
              <section className="product-summary-pane">
                <div className="product-tag">MindBody Wellness Station</div>
                <h2 className="product-title">SOL REViBE MindBody Wellness Station</h2>
                <p style={{ fontSize: '0.875rem', color: '#64748B', marginTop: '-0.5rem', marginBottom: '1rem', fontWeight: 500 }}>
                  P90 Plus Complete Station Package
                </p>

                <div className="price-display">
                  <span className="price-currency">$</span>
                  <span className="price-amount">{currentPrice}</span>
                  <span className="price-unit">USD</span>
                  {pricingPlan === 'split' && (
                    <span style={{ fontSize: '0.85rem', color: '#64748b', marginLeft: '6px' }}>/ month (2 payments)</span>
                  )}
                </div>

                <div className="pricing-toggle-box">
                  <div
                    className={`toggle-option ${pricingPlan === 'full' ? 'active' : ''}`}
                    onClick={() => setPricingPlan('full')}
                  >
                    <div className="toggle-radio"></div>
                    <div className="toggle-text">
                      <strong>Pay in Full: $2,495</strong>
                      <small>Save $1,355 vs regular MSRP</small>
                    </div>
                  </div>
                  <div
                    className={`toggle-option ${pricingPlan === 'split' ? 'active' : ''}`}
                    onClick={() => setPricingPlan('split')}
                  >
                    <div className="toggle-radio"></div>
                    <div className="toggle-text">
                      <strong>2 Monthly Payments of $1,250</strong>
                      <small>$2,500 total package price</small>
                    </div>
                  </div>
                </div>

                <div className="station-photo-wrapper">
                  <img
                    src="assets/soul_revive_station_package.jpg"
                    alt="SOL REViBE MindBody Wellness Station Complete Package"
                    className="station-photo"
                  />
                  <div className="station-photo-badge">Complete 5-Piece Station Setup</div>
                </div>

                <div className="included-section">
                  <h3 className="section-heading">Package Includes:</h3>
                  <ul className="deliverables-list">
                    <li>
                      <div className="check-bullet">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <div>
                        <strong>P90 Plus Dual-Frequency Core Platform</strong>
                        <p>Advanced Terahertz & PEMF bio-resonance frequency engine for cellular rebalance.</p>
                      </div>
                    </li>
                    <li>
                      <div className="check-bullet">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <div>
                        <strong>Zero-Gravity Ergonomic Station Chair</strong>
                        <p>Engineered body alignment lounge chair for optimal bio-frequency conductivity.</p>
                      </div>
                    </li>
                    <li>
                      <div className="check-bullet">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <div>
                        <strong>Heavy-Duty Station Stand & Dock</strong>
                        <p>Precision multi-angle adjustable mounting stand for effortless daily sessions.</p>
                      </div>
                    </li>
                    <li>
                      <div className="check-bullet">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <div>
                        <strong>Ultrasonic Ambient Diffuser</strong>
                        <p>Aromatherapy & negative-ion micro-mist sensory integration.</p>
                      </div>
                    </li>
                    <li>
                      <div className="check-bullet">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <div>
                        <strong>Retractable Banner & Display Screen Kit</strong>
                        <p>Official SOL REViBE privacy backdrop and station presentation kit.</p>
                      </div>
                    </li>
                    <li>
                      <div className="check-bullet">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <div>
                        <strong>1-Year Manufacturer Warranty Registration</strong>
                        <p>Official registration authenticated directly using your Government ID.</p>
                      </div>
                    </li>
                    <li>
                      <div className="check-bullet">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <div>
                        <strong>Insured Freight Delivery</strong>
                        <p>White-glove doorstep freight delivery included at $0 cost ($250 value).</p>
                      </div>
                    </li>
                  </ul>
                </div>

                <div className="trust-callout">
                  <svg className="callout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4" />
                    <path d="M12 8h.01" />
                  </svg>
                  <div>
                    <strong>Direct Single-Page Customer Order</strong>
                    <p>Guaranteed genuine unit dispatch with 1-Year Manufacturer Warranty protection.</p>
                  </div>
                </div>
              </section>

              {/* Right Column: Checkout Form */}
              <section className="form-pane">
                <form onSubmit={handleSubmit} className="checkout-form">
                  {/* Section 1: Customer Information */}
                  <div className="form-section">
                    <h3 className="form-section-title">
                      <span className="step-num">1</span> Customer Information
                    </h3>
                    <div className="input-group">
                      <label htmlFor="fullName">Full Name *</label>
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        required
                        placeholder="Eleanor Vance"
                        value={formData.fullName}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="input-row-2col">
                      <div className="input-group">
                        <label htmlFor="email">Email Address *</label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          required
                          placeholder="eleanor@wellness.com"
                          value={formData.email}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="input-group">
                        <label htmlFor="phone">Phone Number *</label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          required
                          placeholder="(555) 234-5678"
                          value={formData.phone}
                          onChange={handlePhoneChange}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Delivery Address */}
                  <div className="form-section">
                    <h3 className="form-section-title">
                      <span className="step-num">2</span> Delivery Address
                    </h3>
                    <div className="input-group">
                      <label htmlFor="address">Street Address *</label>
                      <input
                        type="text"
                        id="address"
                        name="address"
                        required
                        placeholder="1234 Harmony Blvd, Suite 100"
                        value={formData.address}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="input-row-3col">
                      <div className="input-group">
                        <label htmlFor="city">City *</label>
                        <input
                          type="text"
                          id="city"
                          name="city"
                          required
                          placeholder="Austin"
                          value={formData.city}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="input-group">
                        <label htmlFor="state">State *</label>
                        <input
                          type="text"
                          id="state"
                          name="state"
                          required
                          placeholder="TX"
                          value={formData.state}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="input-group">
                        <label htmlFor="zip">ZIP Code *</label>
                        <input
                          type="text"
                          id="zip"
                          name="zip"
                          required
                          placeholder="78701"
                          value={formData.zip}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div style={{ marginTop: '0.75rem' }}>
                      <label className="checkbox-wrap">
                        <input
                          type="checkbox"
                          name="sameAsShipping"
                          checked={formData.sameAsShipping}
                          onChange={handleInputChange}
                        />
                        <span>Billing address matches shipping address</span>
                      </label>

                      {!formData.sameAsShipping && (
                        <div className="billing-subform">
                          <div className="input-group">
                            <label>Billing Street Address *</label>
                            <input
                              type="text"
                              name="billingAddress"
                              placeholder="Street Address"
                              value={formData.billingAddress}
                              onChange={handleInputChange}
                            />
                          </div>
                          <div className="input-row-3col">
                            <div className="input-group">
                              <label>City</label>
                              <input
                                type="text"
                                name="billingCity"
                                placeholder="City"
                                value={formData.billingCity}
                                onChange={handleInputChange}
                              />
                            </div>
                            <div className="input-group">
                              <label>State</label>
                              <input
                                type="text"
                                name="billingState"
                                placeholder="ST"
                                value={formData.billingState}
                                onChange={handleInputChange}
                              />
                            </div>
                            <div className="input-group">
                              <label>ZIP</label>
                              <input
                                type="text"
                                name="billingZip"
                                placeholder="ZIP"
                                value={formData.billingZip}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Section 3: REQUIRED LINE/NOTE FOR WARRANTY */}
                  <div className="form-section warranty-highlight-section">
                    <div className="warranty-title-bar">
                      <h3 className="form-section-title" style={{ color: '#065f46' }}>
                        <span className="step-num" style={{ backgroundColor: '#059669' }}>
                          3
                        </span>{' '}
                        Official Warranty Registration
                      </h3>
                      <span className="warranty-pill-tag">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                        1-Year Manufacturer Warranty
                      </span>
                    </div>

                    <div className="input-group" style={{ marginTop: '0.75rem' }}>
                      <label htmlFor="governmentId" style={{ color: '#065f46', fontWeight: 700 }}>
                        Driver's License / Government ID Number *
                      </label>
                      <div className="hosted-field-input" style={{ borderColor: '#10B981' }}>
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#059669"
                          strokeWidth="2"
                          width="18"
                          height="18"
                          style={{ marginRight: '8px', flexShrink: 0 }}
                        >
                          <rect x="2" y="4" width="20" height="16" rx="2" />
                          <circle cx="8" cy="10" r="2" />
                          <path d="M15 8h2m-2 4h2m-8 4h8" />
                        </svg>
                        <input
                          type="text"
                          id="governmentId"
                          name="governmentId"
                          required
                          placeholder="Enter Driver's License or Government ID Number"
                          value={formData.governmentId}
                          onChange={handleInputChange}
                          style={{ fontWeight: 600, letterSpacing: '0.04em' }}
                        />
                      </div>

                      <div className="warranty-explicit-callout">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#047857"
                          strokeWidth="2.2"
                          width="17"
                          height="17"
                          style={{ flexShrink: 0, marginTop: '2px' }}
                        >
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="16" x2="12" y2="12" />
                          <line x1="12" y1="8" x2="12.01" y2="8" />
                        </svg>
                        <p>
                          <strong>
                            Your Driver's License or Government ID Number is required strictly to register your device for the
                            one-year manufacturer warranty.
                          </strong>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Section 4: Clean Credit Card Payment Processing */}
                  <div className="form-section">
                    <div className="pci-header">
                      <h3 className="form-section-title">
                        <span className="step-num">4</span> Payment Details
                      </h3>
                      <div className="pci-shield-tag">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        256-Bit SSL Encrypted
                      </div>
                    </div>

                    <div className="input-group">
                      <label htmlFor="cardholderName">Cardholder Name *</label>
                      <input
                        type="text"
                        id="cardholderName"
                        name="cardholderName"
                        required
                        placeholder="Name as printed on card"
                        value={formData.cardholderName}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="hosted-iframe-container">
                      <div className="iframe-badge-bar">
                        <span className="iframe-title">
                          <svg className="lock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                          Clean Credit Card Payment Processing
                        </span>
                        <div className="active-card-badges">
                          <span className={`card-chip ${cardType === 'visa' ? 'active' : ''}`}>VISA</span>
                          <span className={`card-chip ${cardType === 'mastercard' ? 'active' : ''}`}>MC</span>
                          <span className={`card-chip ${cardType === 'amex' ? 'active' : ''}`}>AMEX</span>
                          <span className={`card-chip ${cardType === 'discover' ? 'active' : ''}`}>DISC</span>
                        </div>
                      </div>

                      <div className="iframe-form-fields">
                        <div className="input-group">
                          <label>Card Number *</label>
                          <div className="hosted-field-input">
                            <svg className="field-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                              <line x1="1" y1="10" x2="23" y2="10" />
                            </svg>
                            <input
                              type="text"
                              required
                              placeholder="4000 1234 5678 9010"
                              maxLength="19"
                              value={formData.cardNumber}
                              onChange={handleCardNumberChange}
                            />
                            <span className="field-secure-tag">Encrypted</span>
                          </div>
                        </div>

                        <div className="input-row-2col">
                          <div className="input-group">
                            <label>Expiration (MM/YY) *</label>
                            <div className="hosted-field-input">
                              <input
                                type="text"
                                required
                                placeholder="MM / YY"
                                maxLength="7"
                                value={formData.cardExp}
                                onChange={handleExpChange}
                              />
                            </div>
                          </div>
                          <div className="input-group">
                            <label>CVC / CVV *</label>
                            <div className="hosted-field-input">
                              <input
                                type="password"
                                required
                                placeholder="•••"
                                maxLength="4"
                                value={formData.cardCvc}
                                onChange={(e) =>
                                  setFormData((p) => ({ ...p, cardCvc: e.target.value.replace(/\D/g, '').slice(0, 4) }))
                                }
                              />
                              <svg className="cvv-lock" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 16v-4" />
                                <path d="M12 8h.01" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="submit-wrap">
                    <button type="submit" className="main-cta-btn" disabled={paymentState.isProcessing}>
                      {paymentState.isProcessing ? (
                        <span className="btn-loading-flex">
                          <span className="spinner"></span>
                          Registering Warranty & Authorizing Order...
                        </span>
                      ) : (
                        <span>Authorize & Complete Order - ${currentPrice}</span>
                      )}
                    </button>
                    <p className="guarantee-microtext">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                      Backed by 1-Year Manufacturer Warranty & 256-Bit SSL Encryption
                    </p>
                  </div>
                </form>
              </section>
            </div>
          )}
        </div>

        <footer className="compliance-footer">
          <div className="card-logos-row">
            <span className="accepted-cards-label">Accepted Payment Methods:</span>
            <div className="card-icons flex-wrap">
              <div className="card-logo-badge visa" title="Visa">
                <svg viewBox="0 0 36 24" width="48" height="32">
                  <rect width="36" height="24" rx="3" fill="#1A1F71" />
                  <path
                    d="M13.8 16.5h-2.3l1.4-8.7h2.3l-1.4 8.7zm7.5-8.5c-.5-.2-1.2-.4-2.1-.4-2.3 0-3.9 1.2-3.9 2.9 0 1.3 1.2 2 2.1 2.4.9.4 1.2.7 1.2 1.1 0 .6-.7.9-1.4.9-1 0-1.5-.1-2.3-.5l-.3-.2-.3 2c.6.3 1.7.5 2.8.5 2.5 0 4.1-1.2 4.1-3 0-1-.6-1.8-1.9-2.4-.8-.4-1.3-.7-1.3-1.1 0-.4.4-.7 1.3-.7.8 0 1.4.2 1.8.4l.2.1.4-1.9zm4.7 6.1l.9-2.5.5 2.5h-1.4zm2.1-6.3h-1.8c-.6 0-1 .2-1.2.8l-3.5 8.4h2.4l.5-1.3h3l.3 1.3h2.1l-1.8-9.2zm-17.7 0l-2.3 8.7H6l-1.1-6.1c-.1-.4-.2-.5-.5-.7-.6-.3-1.6-.7-2.4-.9l.1-.3h3.9c.5 0 .9.3 1 .9l.9 5.2 2.4-7.7h2.4z"
                    fill="#FFF"
                  />
                </svg>
              </div>
              <div className="card-logo-badge mastercard" title="Mastercard">
                <svg viewBox="0 0 36 24" width="48" height="32">
                  <rect width="36" height="24" rx="3" fill="#0A0E27" />
                  <circle cx="14" cy="12" r="7" fill="#EB001B" />
                  <circle cx="22" cy="12" r="7" fill="#F79E1B" />
                  <path
                    d="M18 6.9A6.97 6.97 0 0015.4 12c0 2.1.9 4 2.6 5.1A6.97 6.97 0 0020.6 12c0-2.1-.9-4-2.6-5.1z"
                    fill="#FF5F00"
                  />
                </svg>
              </div>
              <div className="card-logo-badge amex" title="American Express">
                <svg viewBox="0 0 36 24" width="48" height="32">
                  <rect width="36" height="24" rx="3" fill="#006FCF" />
                  <path
                    d="M6 15.5l1.2-3.2h2.2l1.2 3.2h2l-2.8-7.2h-2.1L4.7 15.5H6zm10.7 0V8.3h-4.3v7.2h2.1v-2.7h2.2v-1.7h-2.2v-1.2h2.2v-1.6h-4.3zm6 0l1.9-4.2 1.9 4.2h2.4l-3.1-6.5 3-6h-2.3l-1.9 4-1.9-4h-2.3l3 6-3.1 6.5h2.4z"
                    fill="#FFF"
                  />
                </svg>
              </div>
              <div className="card-logo-badge discover" title="Discover">
                <svg viewBox="0 0 36 24" width="48" height="32">
                  <rect width="36" height="24" rx="3" fill="#231F20" />
                  <path
                    d="M4 15.5h3.2c2.1 0 3.6-1.3 3.6-3.6s-1.5-3.6-3.6-3.6H4v7.2zm2.1-5.6h1.1c1 0 1.6.5 1.6 1.9 0 1.4-.6 1.9-1.6 1.9H6.1v-3.8zm6.4 5.6h2.1V8.3h-2.1v7.2zm9 0c2.1 0 3.5-1.5 3.5-3.6 0-2.1-1.4-3.6-3.5-3.6s-3.5 1.5-3.5 3.6c0 2.1 1.4 3.6 3.5 3.6zm0-5.6c.9 0 1.5.8 1.5 2s-.6 2-1.5 2-1.5-.8-1.5-2 .6-2 1.5-2z"
                    fill="#FFF"
                  />
                  <circle cx="21.5" cy="11.9" r="2" fill="#F48120" />
                </svg>
              </div>
            </div>
          </div>

          <div className="policy-links-row">
            <button type="button" className="policy-link" onClick={() => setActiveModal('terms')}>
              Terms of Service
            </button>
            <span className="link-divider">•</span>
            <button type="button" className="policy-link" onClick={() => setActiveModal('privacy')}>
              Privacy Policy
            </button>
            <span className="link-divider">•</span>
            <button type="button" className="policy-link" onClick={() => setActiveModal('shipping')}>
              Shipping Policy
            </button>
            <span className="link-divider">•</span>
            <button type="button" className="policy-link" onClick={() => setActiveModal('guarantee')}>
              1-Year Warranty Terms
            </button>
          </div>

          <div className="copyright-line">
            &copy; {new Date().getFullYear()} SOL REViBE &bull; MindBody Wellness Station. All Rights Reserved.
          </div>
        </footer>
      </main>
    </div>
  );
}
