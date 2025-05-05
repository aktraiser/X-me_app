'use client';

import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';

export default function TermsPage() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Éviter les erreurs d'hydratation
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-gray-200">
        Conditions Générales d&apos;Utilisation et de Vente (CGU/CGV) de Xandme
      </h1>
      <p className="text-sm mb-8 text-gray-800 dark:text-gray-200">
        Version en vigueur au 17 février 2025
      </p>
      
      <div className="space-y-8 text-gray-800 dark:text-gray-200">
        <section>
          <h2 className="text-2xl font-semibold mb-4">1. Objet</h2>
          <p className="mb-4">
            Les présentes Conditions Générales d&apos;Utilisation (CGU) régissent l&apos;accès et l&apos;utilisation de la plateforme X&ME, 
            qui vise à fournir aux entrepreneurs des informations précises et actionnables (« informaction ») ainsi qu&apos;une mise en relation 
            avec des experts qualifiés pour répondre à leurs besoins. Ces CGU s&apos;appliquent à tous les utilisateurs de la plateforme. 
            Les modules payants disponibles sur la plateforme sont soumis à des CGU/CGV spécifiques.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">2. Utilisation de la plateforme</h2>
          <h3 className="text-xl font-semibold mb-2">2.1 Accès utilisateur</h3>
          <p className="mb-4">
            L&apos;accès à la plateforme Xandme est réservé aux utilisateurs inscrits et ayant accepté les présentes CGU. 
            Les informations fournies doivent être utilisées uniquement dans le cadre défini par ces conditions.
          </p>
          <h3 className="text-xl font-semibold mb-2">2.2 Restrictions d&apos;utilisation</h3>
          <p className="mb-4">
            Il est interdit d&apos;utiliser la plateforme pour des activités contraires à la loi, à l&apos;ordre public ou aux bonnes mœurs, 
            notamment pour diffuser des contenus illégaux, nuisibles ou trompeurs.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">3. Limitation de responsabilité</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold mb-2">3.1 Nature des informations</h3>
              <p>
                Les informations fournies par la plateforme sont à titre indicatif et font l&apos;objet de mises à jour régulières 
                pour garantir leur pertinence et leur enrichissement. X&ME ne garantit ni leur exhaustivité ni leur exactitude.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">3.2 Rôle de facilitateur</h3>
              <p>
                Xandme agit en tant que facilitateur pour aider les entrepreneurs à prendre des décisions à partir des informations fournies. 
                La responsabilité finale de l&apos;utilisation des informations ou des mises en relation incombe aux utilisateurs.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">3.3 Absence de garantie</h3>
              <p>
                Xandme ne peut être tenu responsable des pertes financières, pertes de profit ou autres dommages 
                indirects découlant de l&apos;utilisation de la plateforme.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">3.4 Responsabilité des experts</h3>
              <p>
                Xandme ne peut être tenu responsable des actes ou omissions des experts recommandés, ces derniers 
                exerçant leur activité de manière indépendante et sous leur propre responsabilité.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">3.5 Fausse déclaration des utilisateurs</h3>
              <p>
                Xandme décline toute responsabilité en cas de préjudice causé par des informations incorrectes ou 
                trompeuses fournies par les utilisateurs de la plateforme.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">3.6 Responsabilité en matière de cybersécurité</h3>
              <p>
                Les utilisateurs sont responsables de la sécurité de leurs propres systèmes lorsqu&apos;ils accèdent 
                à la plateforme. Cela inclut l&apos;utilisation d&apos;antivirus et la gestion sécurisée des mots de passe.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">3.7 Indemnisation en cas de violation</h3>
              <p>
                Les utilisateurs s&apos;engagent à indemniser X&ME pour tout préjudice causé par une violation des 
                présentes CGU, notamment en cas d&apos;usage frauduleux ou abusif de la plateforme.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">3.8 Obligations des experts partenaires</h3>
              <p>
                Les experts partenaires s&apos;engagent à fournir des services conformes aux normes professionnelles 
                et légales applicables. X&ME ne pourra être tenu responsable de tout manquement des experts à leurs obligations.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">4. Propriété intellectuelle</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold mb-2">4.1 Contenus protégés</h3>
              <p>
                Tous les éléments présents sur la plateforme (textes, images, vidéos, codes, bases de données) sont 
                protégés par le droit de la propriété intellectuelle. Toute reproduction, représentation ou exploitation, 
                totale ou partielle, sans autorisation préalable écrite de X&ME, est strictement interdite.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">4.2 Licence limitée</h3>
              <p>
                X&ME accorde aux utilisateurs une licence d&apos;utilisation non exclusive, non transférable et 
                strictement personnelle pour accéder aux contenus de la plateforme conformément aux présentes CGU.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">4.3 Interdiction de contournement des services</h3>
              <p>
                Il est interdit de contourner les services de mise en relation proposés par la plateforme, notamment 
                en contactant directement les experts recommandés sans passer par X&ME.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">4.4 Responsabilité des utilisateurs</h3>
              <p>
                Les utilisateurs sont responsables de tout usage non autorisé ou illégal des contenus de la plateforme. 
                Xandme se réserve le droit d&apos;engager des poursuites judiciaires pour toute atteinte à ses droits 
                de propriété intellectuelle.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">4.5 Protection contre le scraping</h3>
              <p>
                L&apos;utilisation de bots, scripts ou tout autre outil d&apos;automatisation pour collecter des données 
                ou interagir avec la plateforme sans autorisation explicite est strictement interdite.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">4.6 Audit de l&apos;utilisation</h3>
              <p>
                X&ME se réserve le droit de réaliser des audits périodiques sur l&apos;utilisation des contenus et 
                services de la plateforme afin de détecter tout usage non conforme aux présentes CGU.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">5. Protection des données personnelles</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold mb-2">5.1 Conformité au RGPD</h3>
              <p>
                Xandme s&apos;engage à respecter la réglementation en vigueur en matière de protection des données 
                personnelles (RGPD). Les données collectées sont utilisées uniquement pour fournir les services et 
                améliorer l&apos;expérience utilisateur.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">5.2 Partage des données</h3>
              <p>
                Certaines données peuvent être partagées avec des tiers, notamment les experts, uniquement dans le 
                cadre du bon fonctionnement des services et avec le consentement de l&apos;utilisateur.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">5.3 Durée de conservation</h3>
              <p>
                Les données personnelles sont conservées pour une durée strictement nécessaire à la fourniture des 
                services, sauf obligations légales contraires.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">5.4 Mesures de sécurité</h3>
              <p>
                Xandme met en place des mesures techniques et organisationnelles appropriées pour protéger les données 
                personnelles contre toute destruction, perte, altération ou divulgation non autorisée.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">5.5 Politique de sauvegarde</h3>
              <p>
                Les données collectées sont régulièrement sauvegardées, mais X&ME ne garantit pas une récupération 
                totale en cas de perte accidentelle ou de cyberattaque.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">5.6 Utilisation des avis</h3>
              <p>
                Tout avis ou témoignage collecté auprès des utilisateurs pourra être utilisé par X&ME à des fins 
                marketing, sous réserve du consentement explicite de l&apos;utilisateur.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">6. Résiliation</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold mb-2">6.1 Par l&apos;utilisateur</h3>
              <p>
                Les utilisateurs peuvent résilier leur compte à tout moment en contactant <a href="mailto:support@xandme.fr">support@xandme.fr</a>. Les 
                modules ou services payants liés à leur compte seront soumis à leurs propres conditions.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">6.2 Par Xandme</h3>
              <p>
                Xandme se réserve le droit de suspendre ou de résilier un compte en cas de non-respect des présentes 
                CGU, d&apos;abus ou d&apos;utilisation frauduleuse de la plateforme.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">6.3 Conséquences de la résiliation</h3>
              <p>
                La résiliation entraîne la suppression des données personnelles et l&apos;inaccessibilité aux contenus 
                et services associés au compte, sauf obligation légale de conservation.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">6.4 Utilisation abusive</h3>
              <p>
                Toute tentative d&apos;utilisation abusive ou frauduleuse des services proposés par X&ME entraînera 
                une résiliation immédiate du compte utilisateur, sans préavis.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">6.5 Modalités de contestation</h3>
              <p>
                En cas de résiliation, l&apos;utilisateur dispose d&apos;un délai de 30 jours pour contester la 
                décision en contactant le support à l&apos;adresse <a href="mailto:support@xandme.fr">support@xandme.fr</a>.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">7. Mécanisme de signalement</h2>
          <p className="mb-4">
            Les utilisateurs peuvent signaler tout contenu ou comportement inapproprié sur la plateforme en envoyant 
            un email détaillé à <a href="mailto:support@xandme.fr">support@xandme.fr</a>. La plateforme s&apos;engage à examiner les signalements dans les 
            plus brefs délais et à prendre les mesures appropriées si nécessaire.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">8. Modification des CGU</h2>
          <p className="mb-4">
            Xandme peut modifier les présentes CGU à tout moment. Les utilisateurs seront informés des modifications 
            via une notification sur la plateforme ou par email, au moins 15 jours avant leur application. Les 
            utilisateurs auront la possibilité de contester ou de refuser les modifications en résiliant leur compte 
            sans pénalité avant l&apos;entrée en vigueur des nouvelles conditions. En continuant à utiliser la 
            plateforme, les utilisateurs acceptent les nouvelles conditions.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">9. Règlement des litiges</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold mb-2">9.1 Médiation</h3>
              <p>
                En cas de litige, les parties s&apos;engagent à tenter une résolution amiable avant toute action 
                judiciaire. Une procédure de médiation peut être mise en place.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">9.2 Tribunaux compétents</h3>
              <p>
                En l&apos;absence de résolution amiable, les litiges seront soumis à la compétence exclusive des 
                tribunaux français et régis par le droit français.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">9.3 Sanctions</h3>
              <p>
                Xandme se réserve le droit d&apos;appliquer des sanctions, telles que la suspension temporaire ou 
                définitive d&apos;un compte utilisateur, en cas de violation des présentes CGU.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">9.4 Juridiction internationale</h3>
              <p>
                Les utilisateurs situés hors de France acceptent que le droit français régisse leur utilisation de 
                la plateforme, même en cas de conflits juridiques dans d&apos;autres pays.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">10. Force majeure</h2>
          <p className="mb-4">
            Xandme ne pourra être tenu responsable des retards ou de l&apos;inexécution de ses obligations en raison 
            de circonstances imprévisibles ou indépendantes de sa volonté (force majeure), telles que des pandémies, 
            des grèves générales, des interruptions majeures d&apos;Internet, ou des catastrophes naturelles.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">11. Acceptation des CGU</h2>
          <p className="mb-4">
            L&apos;utilisation de la plateforme implique l&apos;acceptation pleine et entière des présentes CGU. 
            Cette acceptation est matérialisée par une case à cocher lors de l&apos;inscription. En outre, 
            l&apos;utilisateur accepte automatiquement les CGU mises à jour en continuant à utiliser la plateforme 
            après les modifications.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">12. Politique d&apos;utilisation acceptable (PUA)</h2>
          <p className="mb-4">
            Les utilisateurs s&apos;engagent à utiliser la plateforme de manière conforme à la loi et aux objectifs 
            de X&ME. Toute activité illicite, nuisible ou concurrentielle est interdite, notamment :
          </p>
          <ul className="list-disc pl-8 mb-4">
            <li>La diffusion de contenus diffamatoires ou illégaux.</li>
            <li>Le démarchage commercial non autorisé.</li>
            <li>La copie ou l&apos;exploitation non autorisée de contenus de la plateforme.</li>
          </ul>
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold mb-2">12.1 Interdiction de sollicitation</h3>
              <p>
                Les utilisateurs ne peuvent pas solliciter directement les employés ou partenaires de X&ME à des 
                fins commerciales ou concurrentielles sans accord préalable écrit.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">12.2 Obligations des utilisateurs</h3>
              <p>
                Les utilisateurs doivent fournir des informations véridiques et à jour lors de leur inscription et 
                utilisation de la plateforme. Toute omission ou falsification peut entraîner des sanctions.
              </p>
            </div>
          </div>
        </section>

        <p className="mt-8 text-sm text-gray-600 dark:text-gray-400">
          Dernière mise à jour: 17 février 2025
        </p>
      </div>
    </>
  );
} 