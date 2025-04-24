import React from 'react';

export default function PolitiqueConfidentialite() {
  return (
    <div className="min-h-screen bg-light-primary dark:bg-dark-primary p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-white dark:text-black">Politique de confidentialité</h1>
        
        <div className="space-y-6 text-white dark:text-black">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Collecte des données</h2>
            <p className="mb-4">
              Nous collectons uniquement les données nécessaires au bon fonctionnement de notre service.
              Ces données incluent vos informations de profil et vos interactions sur la plateforme.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Utilisation des données</h2>
            <p className="mb-4">
              Vos données sont utilisées pour personnaliser votre expérience, améliorer nos services
              et faciliter la mise en relation avec les experts appropriés.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Protection des données</h2>
            <p className="mb-4">
              Nous mettons en œuvre des mesures de sécurité appropriées pour protéger vos données
              personnelles contre tout accès non autorisé ou toute utilisation abusive.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Vos droits</h2>
            <p className="mb-4">
              Vous disposez d&apos;un droit d&apos;accès, de rectification et de suppression de vos données.
              Pour exercer ces droits, contactez-nous via notre formulaire de contact.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
} 