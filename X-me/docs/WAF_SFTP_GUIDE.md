# Guide d'implémentation de WAF et SFTP pour X-me

## Introduction

Ce document explique comment mettre en place un Web Application Firewall (WAF) via Supabase Edge Functions et comment utiliser SFTP pour les transferts de fichiers sécurisés.

## 1. Implémentation du WAF avec Supabase Edge Functions

Nous utilisons Supabase Edge Functions comme passerelle sécurisée pour les uploads de fichiers, avec un WAF intégré qui protège contre diverses attaques.

### Prérequis

- Compte Supabase (utilisez votre compte existant)
- CLI Supabase installée localement
- Un projet Supabase actif

### Installation de la CLI Supabase

```bash
npm install -g supabase
```

### Configuration locale

1. Connectez-vous à votre compte Supabase:

```bash
supabase login
```

2. Liez votre projet local à votre projet Supabase:

```bash
supabase link --project-ref <REFERENCE_PROJET_SUPABASE>
```

### Déploiement des Edge Functions

1. Déployez l'Edge Function pour l'upload sécurisé:

```bash
supabase functions deploy secure-upload
```

2. Configurez les variables d'environnement requises:

```bash
supabase secrets set SUPABASE_URL=<VOTRE_URL_SUPABASE>
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<VOTRE_CLE_SERVICE_ROLE>
```

### Création du bucket Storage

Dans l'interface Supabase, créez un bucket "uploads" avec les paramètres suivants:
- Public: Non
- Limite de taille: 20 Mo
- Types MIME autorisés: application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document, text/plain

### Migration de la base de données

Exécutez la migration SQL pour créer la table "files":

```bash
supabase db push
```

### Utilisation dans le frontend

Utilisez les fonctions d'upload sécurisé dans votre frontend:

```typescript
import { secureUploadFile } from '@/utils/secure-upload';

// Pour téléverser un fichier
const result = await secureUploadFile(file, {
  embedding_model: 'text-embedding-3-small',
  embedding_model_provider: 'openai'
});

// Pour récupérer un fichier
const url = await getSecureFileUrl(fileId);
```

## 2. Utilisation de SFTP pour les transferts de fichiers administratifs

Pour les transferts administratifs, utilisez SFTP plutôt que FTP non sécurisé.

### Configuration du serveur SFTP

Si vous devez configurer un serveur SFTP sur votre instance:

1. Installez OpenSSH:

```bash
sudo apt update
sudo apt install openssh-server
```

2. Configurez le service SSH:

```bash
sudo nano /etc/ssh/sshd_config
```

3. Assurez-vous que les paramètres suivants sont définis:

```
PasswordAuthentication no  # Désactiver l'authentification par mot de passe
PubkeyAuthentication yes   # Activer l'authentification par clé publique
PermitRootLogin no         # Interdire la connexion root
```

4. Redémarrez le service SSH:

```bash
sudo systemctl restart sshd
```

### Utilisation d'un client SFTP

Pour les utilisateurs, recommandez ces clients SFTP:

- **Windows**: WinSCP, FileZilla
- **macOS**: Cyberduck, FileZilla
- **Linux**: FileZilla, commandline sftp

### Commandes SFTP de base

```bash
# Connexion
sftp user@your-server.com

# Téléchargement
put local-file.pdf remote-file.pdf

# Téléchargement
get remote-file.pdf local-file.pdf

# Navigation
cd /path/to/directory
ls
```

## 3. Avantages de sécurité

### Avantages du WAF Supabase Edge Functions

- **Protection contre les injections**: Filtrage des requêtes malveillantes
- **Limitation de débit**: Protection contre les attaques par force brute
- **Validation des types de fichiers**: Prévention des uploads malveillants
- **Authentification JWT**: Vérification d'identité
- **Geo-restriction**: Blocage des requêtes provenant de pays spécifiques

### Avantages de SFTP vs FTP

- **Chiffrement**: Toutes les données sont chiffrées en transit
- **Authentification forte**: Utilisation de clés SSH plutôt que de mots de passe
- **Intégrité des données**: Vérification que les fichiers n'ont pas été altérés
- **Tunneling sécurisé**: Fonctionne à travers un tunnel SSH sécurisé

## 4. Maintenance et surveillance

### Surveillance des Edge Functions

```bash
supabase functions logs --fn-name secure-upload
```

### Audit des accès SFTP

Les connexions et activités SFTP sont enregistrées dans `/var/log/auth.log`. Pour surveiller:

```bash
sudo tail -f /var/log/auth.log | grep sshd
```

## Conclusion

En utilisant Supabase Edge Functions comme WAF et SFTP pour les transferts de fichiers administratifs, votre application bénéficie d'une sécurité considérablement améliorée contre les attaques courantes. 