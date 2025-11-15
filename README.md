# 📇 Carte de visite numérique — By </Norma Dev>

Une carte de visite numérique moderne, responsive, avec thème clair/sombre, QR codes dynamiques, et génération automatisée via un script Python.  
Projet pensé pour être **simple à maintenir**, **rapide**, et **accessible sur mobile et ordinateur**.


---

## ✨ Fonctionnalités

### 🔹 Interface
- Design **clair et sombre** complet  
- Thème automatiquement mémorisé  
- Mise en page **100% responsive**  
- Boutons et interactions **modernes et animés**  
- QR Codes cliquables et **agrandissement modal**  
- Icônes SVG personnalisées  
- Chargement dynamique des données via `data.json`

### 🔹 Données dynamiques
Toutes les informations affichées sur la page proviennent du fichier :

```
/assets/data/data.json
```

Ce fichier gère :
- Informations personnelles  
- Coordonnées  
- Réseaux sociaux  
- Versions des CV  
- Chemins vers les QR Codes  
- Métadonnées du site  

Aucun code n’est à modifier pour mettre le site à jour :  
**modifier simplement `data.json` suffit.**

### 🔹 QR Codes
Un script Python génère automatiquement :
- un **QR Code de contact (vCard)**  
- un **QR Code du site web**

Les deux QR Codes ont **exactement la même taille et configuration**.  
Ils sont exportés dans :

```
/assets/img/qr_codes/
```


---

## 📁 Structure du projet
```
/
├── assets/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── app.js
│   ├── json/
│   │   └── data.json
│   ├── py/
│   │   └── qr-code-generator.py
│   ├── img/
│   │   ├── qr_codes/
│   │   │   ├── contact_qr.png
│   │   │   └── site_qr.png
│   │   └── avatar.jpg
│   └── docs/
│       └── CV.pdf
├── qr-code-generator.py
├── index.html
└── README.md
```


---

## 🚀 Installation & utilisation

### 1️⃣ Cloner le projet

```bash
git clone https://github.com/Nolhan-Norma-Dev/digital-card.git
cd digital-card
```


---

## 🛠 Préparation du script Python

### Installer les dépendances

```bash
pip install qrcode pillow
```

Le script utilise :
- `qrcode` (génération)
- `Pillow` (export PNG)


---

## 🔧 Génération des QR Codes

Le script lit **directement ton `data.json` tel qu’il est**, sans aucune modification.

Pour générer ou régénérer les QR Codes depuis la racine du projet :

```bash
python3 ./assets/pysqr-code-generator.py
```

Les fichiers seront créés ici :

```
assets/img/qr_codes/contact_qr.png
assets/img/qr_codes/site_qr.png
```


---

## 🌙 Modes clair et sombre

Le thème change :
- manuellement via un bouton
- automatiquement selon les préférences système
- persistent grâce au `localStorage`

Le `body` et tous les composants sont stylisés dans les deux modes.


---

## 📱 Responsive Design

Le site est optimisé pour :
- smartphone  
- tablette  
- PC  
- écrans larges  

Le contenu s’adapte automatiquement en fonction de la taille de l'écran.


---

## 📄 Mise à jour du contenu

Toutes les données du site sont dans :

```
assets/data/data.json
```

Tu peux modifier :
- Nom  
- Photo  
- Contact  
- Réseaux  
- Versions des CV  
- Chemins des QR Codes  

Aucune modification du code n’est nécessaire.


---

## 📜 Licence

Ce projet est distribué sous licence MIT License.
Vous êtes autorisé à : utiliser, copier, modifier, distribuer, intégrer dans un produit commercial ou non commercial.
Le crédit au créateur est obligatoire sous le même format que ci-dessous.

Crédit image d'ilustration (./assets/img/avatar.jpg) : Designed by Freepik

---

## 👤 Auteur

Projet publié sous le pseudo de **</Norma Dev>**.
→ https://nolhan-bd.fr

Version **1.0.3** du *15 novembre 2025*.