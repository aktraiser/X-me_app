'use client';

import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';

export default function PrivacyPage() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Éviter les erreurs d'hydratation
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Politique de Confidentialité</h1>
      
      <div className="space-y-8 text-gray-800 dark:text-gray-200">
        <p>
          Chez X-me, nous prenons votre vie privée très au sérieux. Cette politique de confidentialité 
          explique comment nous collectons, utilisons et protégeons vos informations personnelles.
        </p>
        
        <section>
          <h2 className="text-2xl font-semibold mb-4">1. Collecte d&apos;Informations</h2>
          <p className="mb-4">
            Nous collectons des informations lorsque vous vous inscrivez sur notre site, vous connectez à votre compte, 
            faites un achat, ou utilisez nos services. Les informations collectées incluent votre nom, adresse email, 
            numéro de téléphone, et potentiellement des informations professionnelles si vous les fournissez.
          </p>
          <p className="mb-4">
            Nous recueillons également automatiquement des informations sur votre navigation, comme votre adresse IP, 
            navigateur, temps passé sur le site et pages visitées. Ces données sont utilisées pour améliorer notre 
            plateforme et votre expérience utilisateur.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">2. Utilisation des Informations</h2>
          <p className="mb-4">
            Les informations que nous collectons auprès de vous peuvent être utilisées pour :
          </p>
          <ul className="list-disc pl-8 mb-4">
            <li>Personnaliser votre expérience et répondre à vos besoins individuels</li>
            <li>Fournir du contenu et des services adaptés</li>
            <li>Améliorer notre site web et nos services</li>
            <li>Vous contacter par email</li>
            <li>Administrer un concours, une promotion, ou une enquête</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">3. Partage d&apos;Informations</h2>
          <p className="mb-4">
            Nous ne vendons, n&apos;échangeons, ni ne transférons vos informations personnelles identifiables à des 
            tiers. Cela n&apos;inclut pas les tiers de confiance qui nous aident à exploiter notre site web ou à 
            mener nos affaires, tant que ces parties conviennent de garder ces informations confidentielles.
          </p>
          <p className="mb-4">
            Nous pouvons également divulguer vos informations lorsque nous estimons que leur divulgation est 
            appropriée pour se conformer à la loi, appliquer les politiques de notre site, ou protéger nos droits, 
            notre propriété ou notre sécurité ou celle d&apos;autrui.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">4. Sécurité des Données</h2>
          <p className="mb-4">
            Nous mettons en œuvre une variété de mesures de sécurité pour maintenir la sécurité de vos informations 
            personnelles. Nous utilisons un cryptage à la pointe de la technologie pour protéger les informations 
            sensibles transmises en ligne. Nous protégeons également vos informations hors ligne. Seuls les employés 
            qui ont besoin d&apos;effectuer un travail spécifique (par exemple, la facturation ou le service à la 
            clientèle) ont accès aux informations personnelles identifiables.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">5. Vos Droits</h2>
          <p className="mb-4">
            Conformément au Règlement Général sur la Protection des Données (RGPD) et autres lois applicables sur la 
            protection des données, vous avez les droits suivants:
          </p>
          <ul className="list-disc pl-8 mb-4">
            <li>Droit d&apos;accès à vos données personnelles</li>
            <li>Droit de rectification des informations inexactes</li>
            <li>Droit à l&apos;effacement de vos données («droit à l&apos;oubli»)</li>
            <li>Droit à la limitation du traitement</li>
            <li>Droit à la portabilité des données</li>
            <li>Droit d&apos;opposition au traitement</li>
          </ul>
          <p className="mb-4">
            Pour exercer ces droits, veuillez nous contacter à l&apos;adresse email indiquée ci-dessous.
            <a href="mailto:support@xandme.fr">support@xandme.fr</a>
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">6. Cookies et Technologies Similaires</h2>
          <p className="mb-4">
            Notre site Web utilise des cookies pour améliorer votre expérience utilisateur. Un cookie est un petit 
            fichier placé sur le disque dur de votre ordinateur. Ces cookies nous permettent de vous identifier 
            lorsque vous naviguez sur notre site, de mémoriser vos préférences et de vous offrir une expérience 
            personnalisée. Vous pouvez configurer votre navigateur pour refuser tous les cookies ou pour indiquer 
            quand un cookie est envoyé. Toutefois, si vous n&apos;acceptez pas les cookies, certaines fonctionnalités 
            de notre site peuvent ne pas fonctionner correctement.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">7. Modifications de la Politique</h2>
          <p className="mb-4">
            Nous pouvons mettre à jour notre politique de confidentialité de temps à autre. Nous vous informerons de 
            tout changement en publiant la nouvelle politique de confidentialité sur cette page et en mettant à jour 
            la date de «dernière mise à jour» ci-dessous. Nous vous encourageons à consulter régulièrement cette 
            politique pour être informé de la façon dont nous protégeons vos informations.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">8. Contact</h2>
          <p className="mb-4">
            Si vous avez des questions concernant cette politique de confidentialité, les pratiques de ce site, ou 
            vos relations avec ce site, veuillez nous contacter à : <a href="mailto:support@xandme.fr">support@xandme.fr</a>
          </p>
        </section>

        <p className="mt-8 text-sm text-gray-600 dark:text-gray-400">
          Dernière mise à jour: 5 mai 2025
        </p>
      </div>
    </>
  );
} 