import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './styles/theme.css';
import './styles/global.css';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import { Catalogue, ProductDetail } from './pages/Shop';
import Cart from './pages/Cart';
import { Login, Register } from './pages/Auth';
import { About, AnnualReport, Awards, Career, Csr, Gallery, Infrastructure, NotFound, ProcessNutrition, Team, Testimonials, Video, WhyChooseUs } from './pages/Info';
import { Contact, DealerEnquiry, SupplierRegistration } from './pages/Forms';
import Policy from './pages/Policies';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="about" element={<About />} />
              <Route path="about/team" element={<Team />} />
              <Route path="about/why-choose-us" element={<WhyChooseUs />} />
              <Route path="about/awards" element={<Awards />} />
              <Route path="video" element={<Video />} />
              {/* Shop routes are self-contained so they can move to a separate shop URL (VITE_SHOP_URL). */}
              <Route path="shop" element={<Catalogue />} />
              <Route path="shop/:slug" element={<ProductDetail />} />
              <Route path="cart" element={<Cart />} />
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              <Route path="infrastructure" element={<Infrastructure />} />
              <Route path="process-nutrition" element={<ProcessNutrition />} />
              <Route path="gallery" element={<Gallery />} />
              <Route path="testimonials" element={<Testimonials />} />
              <Route path="policies/:slug" element={<Policy />} />
              <Route path="contact" element={<Contact />} />
              <Route path="career" element={<Career />} />
              <Route path="dealer/enquiry" element={<DealerEnquiry />} />
              <Route path="dealer/login" element={<Login role="dealer" />} />
              <Route path="supplier/register" element={<SupplierRegistration />} />
              <Route path="supplier/login" element={<Login role="supplier" />} />
              <Route path="csr" element={<Csr />} />
              <Route path="annual-report" element={<AnnualReport />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
