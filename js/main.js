// Elementi DOM
const grid = document.querySelector('.projects-grid');
const popup = document.getElementById('imagePopup');
const popupImage = popup.querySelector('.popup-image');
const popupContent = popup.querySelector('.popup-content');
const nameElement = document.querySelector('.name');
const streetNameElement = document.getElementById('streetName');

// Crea l'overlay
const overlay = document.createElement('div');
overlay.className = 'popup-overlay';
document.body.appendChild(overlay);

// Costanti di configurazione
const maxMove = 400;
const sensitivity = 0.25;

// Variabili di stato
let ticking = false;
let lastKnownMouseX = 0;
let lastKnownMouseY = 0;
let originalAspectRatio = 1;
let originalImageWidth = 0;
let originalImageHeight = 0;
let isResizing = false;
let currentResizeHandle = null;
let initialSize = { width: 0, height: 0 };
let initialPosition = { x: 0, y: 0 };
let isDragging = false;
let dragStartPosition = { x: 0, y: 0 };
let mouseDownOnPopup = false;
let currentPopupContent = null;
let topZIndex = 1000;
let popupStack = [];
let isMultiPopupMode = false;

// Configurazione griglia
const config = {
    columns: 6,
    rows: 4,
    boxSize: 350,
    minBoxSize: 260,
    maxBoxSize: 300,
    minColumns: 6,
    maxColumns: 14,
    lastPinchDistance: 0,
    isAnimating: false,
    minVisibleBoxes: 9,
    userChangedSize: false
};

// Gestione Z-Index e Popup
function bringToFront(popup) {
    const index = popupStack.indexOf(popup);
    if (index !== -1) {
        // Rimuovi il popup dalla sua posizione attuale
        popupStack.splice(index, 1);
        
        // Inseriscilo in cima allo stack
        popupStack.push(popup);
        
        // Aggiorna gli z-index di tutti i popup
        const baseZIndex = 1000;
        const increment = 10;
        
        // Applica solo il z-index a tutti i popup
        popupStack.forEach((p, i) => {
            const content = p.querySelector('.popup-content');
            if (content) {
                p.style.zIndex = baseZIndex + (i * increment);
                content.style.transform = 'scale(1)';
                content.style.opacity = '1';
            }
        });
    }
}

// Gestione del ridimensionamento
function initResize(e, handle, targetPopupContent) {
    isResizing = true;
    currentResizeHandle = handle;
    currentPopupContent = targetPopupContent;
    
    initialPosition = {
        x: e.clientX,
        y: e.clientY
    };
    
    const rect = targetPopupContent.getBoundingClientRect();
    initialSize = {
        width: rect.width,
        height: rect.height,
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom
    };
    
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopResize);
    e.preventDefault();
}

function handleResize(e) {
    if (!isResizing || !currentPopupContent) return;
    
    requestAnimationFrame(() => {
        const moveX = e.clientX - initialPosition.x;
        const moveY = e.clientY - initialPosition.y;
        
        const maxScreenWidth = window.innerWidth * 0.75;
        const maxScreenHeight = window.innerHeight * 0.75;
        const minScreenWidth = window.innerWidth * 0.25;
        const minScreenHeight = window.innerHeight * 0.25;
        
        let newWidth, newHeight, newLeft, newTop;
        
        // Calcola le nuove dimensioni mantenendo l'aspect ratio
        if (currentResizeHandle.includes('right')) {
            newWidth = Math.max(minScreenWidth, Math.min(maxScreenWidth, initialSize.width + moveX));
            newHeight = newWidth / originalAspectRatio;
            newLeft = initialSize.left;
        } else if (currentResizeHandle.includes('left')) {
            newWidth = Math.max(minScreenWidth, Math.min(maxScreenWidth, initialSize.width - moveX));
            newHeight = newWidth / originalAspectRatio;
            newLeft = initialSize.right - newWidth;
        }
        
        // Aggiusta l'altezza se supera i limiti dello schermo
        if (newHeight > maxScreenHeight) {
            newHeight = maxScreenHeight;
            newWidth = newHeight * originalAspectRatio;
            if (currentResizeHandle.includes('left')) {
                newLeft = initialSize.right - newWidth;
            }
        }
        
        // Calcola la posizione verticale
        if (currentResizeHandle.includes('top')) {
            newTop = initialSize.bottom - newHeight;
        } else {
            newTop = initialSize.top;
        }
        
        // Applica le nuove dimensioni e posizione
        if (newWidth >= minScreenWidth && newWidth <= maxScreenWidth &&
            newHeight >= minScreenHeight && newHeight <= maxScreenHeight) {
            const maxLeft = window.innerWidth - newWidth;
            const maxTop = window.innerHeight - newHeight;
            
            currentPopupContent.style.width = `${newWidth}px`;
            currentPopupContent.style.height = `${newHeight}px`;
            currentPopupContent.style.left = `${Math.max(0, Math.min(maxLeft, newLeft))}px`;
            currentPopupContent.style.top = `${Math.max(0, Math.min(maxTop, newTop))}px`;
        }
    });
}

function stopResize() {
    isResizing = false;
    currentResizeHandle = null;
    currentPopupContent = null;
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);
}

// Gestione Popup
function getRandomPosition(width, height) {
    const marginX = window.innerWidth * 0.1;
    const marginY = window.innerHeight * 0.1;
    
    const safeX = window.innerWidth - width - (marginX * 2);
    const safeY = window.innerHeight - height - (marginY * 2);
    
    return {
        left: Math.random() * safeX + marginX,
        top: Math.random() * safeY + marginY
    };
}

function createPopup(imgSrc) {
    showOverlay();
    const newPopup = document.createElement('div');
    newPopup.className = 'popup-container';
    // NASCONDI il popup finché l'immagine non è caricata
    newPopup.style.display = 'none';
    
    const content = document.createElement('div');
    content.className = 'popup-content';
    
    // Imposta le proprietà iniziali
    content.style.transform = 'scale(0.95)';
    content.style.opacity = '0.8';
    
    const handleTemplate = document.createElement('div');
    ['top-left', 'top-right', 'bottom-left', 'bottom-right'].forEach(position => {
        const handle = handleTemplate.cloneNode();
        handle.className = `resize-handle ${position}`;
        handle.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            const targetPopup = handle.closest('.popup-container');
            bringToFront(targetPopup);
            const handleClass = position;
            initResize(e, handleClass, content);
        }, { passive: false });
        content.appendChild(handle);
    });
    
    const img = document.createElement('img');
    img.className = 'popup-image';
    img.src = imgSrc;
    img.alt = 'Immagine ingrandita';
    
    // Aggiungi il popup allo stack IMMEDIATAMENTE, prima che l'immagine si carichi
    popupStack.push(newPopup);
    
    // Imposta l'aspect ratio iniziale quando l'immagine è caricata
    img.onload = () => {
        originalAspectRatio = img.naturalWidth / img.naturalHeight;
        
        // Calcola una dimensione casuale tra 40% e 60% dello schermo
        const randomPercentage = 40 + Math.random() * 20;
        const maxWidth = window.innerWidth * (randomPercentage / 100);
        const maxHeight = window.innerHeight * (randomPercentage / 100);
        
        let width = maxWidth;
        let height = width / originalAspectRatio;
        
        if (height > maxHeight) {
            height = maxHeight;
            width = height * originalAspectRatio;
        }
        
        content.style.width = `${width}px`;
        content.style.height = `${height}px`;
        
        const pos = getRandomPosition(width, height);
        content.style.left = `${pos.left}px`;
        content.style.top = `${pos.top}px`;
        
        // MOSTRA il popup solo quando l'immagine è caricata
        newPopup.style.display = 'flex';
        
        // Imposta il z-index
        bringToFront(newPopup);
    };
    
    // Gestisci anche il caso in cui l'immagine non si carichi
    img.onerror = () => {
        // Se l'immagine non si carica, RIMUOVI il popup invece di mostrarlo
        const index = popupStack.indexOf(newPopup);
        if (index !== -1) {
            popupStack.splice(index, 1);
        }
        if (newPopup.parentNode) {
            newPopup.remove();
        }
        
        // Se non ci sono più popup, nascondi l'overlay
        if (popupStack.length === 0) {
            hideOverlay();
            streetNameElement.classList.remove('visible');
            if (config.boxSize >= 280) {
                nameElement.style.display = 'block';
            }
        }
    };
    
    content.appendChild(img);
    
    // Gestione del click sul popup
    content.addEventListener('mousedown', (e) => {
        if (e.target === content || e.target === img) {
            e.stopPropagation();
            const parentPopup = content.closest('.popup-container');
            if (parentPopup) {
                bringToFront(parentPopup);
            }
            initDrag(e, content);
        }
    }, { passive: false });
    
    img.addEventListener('dragstart', (e) => e.preventDefault(), { passive: false });
    
    // Gestione del click fuori dal popup
    newPopup.addEventListener('mousedown', (e) => {
        const rect = content.getBoundingClientRect();
        const isOutside = e.clientX < rect.left || e.clientX > rect.right ||
                        e.clientY < rect.top || e.clientY > rect.bottom;
        
        if (!isOutside) {
            e.stopPropagation();
            bringToFront(newPopup);
            if (!isDragging && !isResizing) {
                initDrag(e, content);
            }
        }
        mouseDownOnPopup = !isOutside;
    }, { passive: false });
    
    newPopup.appendChild(content);
    document.body.appendChild(newPopup);
    
    // Dopo aver aggiunto il popup al DOM, abilita le transizioni
    requestAnimationFrame(() => {
        content.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
    });
}

// Gestione del trascinamento
function initDrag(e, targetPopupContent) {
    if (!targetPopupContent) return;
    
    isDragging = true;
    currentPopupContent = targetPopupContent;
    dragStartPosition = {
        x: e.clientX - targetPopupContent.offsetLeft,
        y: e.clientY - targetPopupContent.offsetTop
    };
    
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', stopDrag);
    e.preventDefault();
}

function handleDrag(e) {
    if (!isDragging || !currentPopupContent) return;
    
    const width = currentPopupContent.offsetWidth;
    const height = currentPopupContent.offsetHeight;
    
    requestAnimationFrame(() => {
        const newX = e.clientX - dragStartPosition.x;
        const newY = e.clientY - dragStartPosition.y;
        
        const maxX = window.innerWidth - width;
        const maxY = window.innerHeight - height;
        
        currentPopupContent.style.left = `${Math.max(0, Math.min(maxX, newX))}px`;
        currentPopupContent.style.top = `${Math.max(0, Math.min(maxY, newY))}px`;
    });
}

function stopDrag() {
    isDragging = false;
    currentPopupContent = null;
    document.removeEventListener('mousemove', handleDrag);
    document.removeEventListener('mouseup', stopDrag);
}

// Funzioni di utilità
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

function updateGridProperties() {
    const root = document.documentElement;
    root.style.setProperty('--columns', config.columns);
    root.style.setProperty('--rows', config.rows);
    root.style.setProperty('--box-size', `${config.boxSize}px`);

    // Rimuovi eventuali transizioni per un aggiornamento netto
    grid.style.transition = 'none'; // Assicurati che non ci siano transizioni
}

function countVisibleBoxes() {
    const { innerWidth: width, innerHeight: height } = window;
    const { boxSize } = config;
    
    const boxesPerRow = (width / boxSize) | 0;
    const boxesPerColumn = (height / boxSize) | 0;
    
    return boxesPerRow * boxesPerColumn;
}

function canUsePinch() {
    const visibleBoxes = countVisibleBoxes();
    const totalBoxes = config.columns * config.rows;
    const allBoxesVisible = visibleBoxes >= totalBoxes;
    return visibleBoxes >= config.minVisibleBoxes && !allBoxesVisible;
}

function resizeGridToFitWindow() {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Calcola la dimensione del box in base alle proporzioni della finestra
    // Considera il gap e il padding nella griglia
    const gap = 3.2; // gap è 0.2rem
    const padding = 19.2; // padding è 1.2rem
    
    // Calcola la dimensione disponibile (considerando gap e padding)
    const availableWidth = windowWidth - (padding * 2);
    const availableHeight = windowHeight - (padding * 2);
    
    // Calcola le dimensioni ottimali per riga e colonna
    const boxWidth = (availableWidth - (gap * (config.columns - 1))) / config.columns;
    const boxHeight = (availableHeight - (gap * (config.rows - 1))) / config.rows;
    
    // Usa la dimensione minore tra larghezza e altezza per mantenere i box quadrati
    let newBoxSize = Math.min(boxWidth, boxHeight);
    
    // Limita tra min e max
    newBoxSize = Math.max(150, Math.min(500, newBoxSize));
    
    config.boxSize = newBoxSize;
    updateGridProperties();
    grid.style.transform = 'translate3d(0, 0, 0) scale(1)';
    
    // Gestisci la visibilità di grispex
    if (config.boxSize < 280) {
        nameElement.style.display = 'none';
    } else {
        nameElement.style.display = 'block';
    }
}

function updatePosition() {
    // Disabilita il movimento della griglia su mobile
    if (isMobile()) return;
    
    if (!ticking) {
        requestAnimationFrame(() => {
            const rect = grid.getBoundingClientRect();
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            
            // Calcola dove dovrebbe essere il bordo della griglia per essere visibile
            // Se la griglia è più grande della finestra, calcoliamo il movimento necessario
            // per mostrare completamente i box più esterni
            
            // Calcola quanto la griglia si estende oltre i bordi dello schermo
            const overflowLeft = Math.max(0, -rect.left);
            const overflowRight = Math.max(0, rect.right - windowWidth);
            const overflowTop = Math.max(0, -rect.top);
            const overflowBottom = Math.max(0, rect.bottom - windowHeight);
            
            // Il movimento massimo orizzontale permette di spostare la griglia
            // così che entrambi i bordi possano essere visti
            const maxHorizontalMove = Math.max(overflowLeft, overflowRight);
            const maxVerticalMove = Math.max(overflowTop, overflowBottom);
            
            const centerX = rect.left + (rect.width * 0.5);
            const centerY = rect.top + (rect.height * 0.5);
            
            const mouseX = (lastKnownMouseX - centerX) * -sensitivity;
            const mouseY = (lastKnownMouseY - centerY) * -sensitivity;
            
            const moveX = Math.max(Math.min(mouseX, maxHorizontalMove), -maxHorizontalMove);
            const moveY = Math.max(Math.min(mouseY, maxVerticalMove), -maxVerticalMove);
            
            const scale = 1 + Math.max(
                Math.abs(moveX),
                Math.abs(mouseY)
            ) / (maxMove * 15);
            
            grid.style.transform = `translate3d(${moveX}px, ${moveY}px, 0) scale(${scale})`;
            ticking = false;
        });
    }
    ticking = true;
}

function handlePinch(e) {
    e.preventDefault();
    
    if (!canUsePinch() || config.isAnimating) return;
    
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];
    
    if (!touch1 || !touch2) return;
    
    const deltaX = touch2.clientX - touch1.clientX;
    const deltaY = touch2.clientY - touch1.clientY;
    const distance = Math.hypot(deltaX, deltaY);
    
    if (config.lastPinchDistance) {
        const delta = distance - config.lastPinchDistance;
        const threshold = 10;
        
        if (Math.abs(delta) > threshold) {
            const isZoomingIn = delta < 0;
            const columnDelta = isZoomingIn ? 2 : -2;
            const newColumns = Math.max(
                config.minColumns,
                Math.min(config.maxColumns, config.columns + columnDelta)
            );
            
            if (newColumns !== config.columns) {
                config.isAnimating = true;
                config.columns = newColumns;
                config.boxSize = Math.floor(window.innerWidth / (newColumns + 2));
                
                requestAnimationFrame(() => {
                    updateGridProperties();
                    setTimeout(() => {
                        config.isAnimating = false;
                    }, 300);
                });
            }
        }
    }
    
    config.lastPinchDistance = distance;
}

function openPopup(imgSrc, clickEvent) {
    showOverlay();
    const rect = clickEvent.target.getBoundingClientRect();
    popup.style.display = 'flex';
    popupImage.src = imgSrc;
    currentPopupContent = popupContent;
    
    const img = new Image();
    img.onload = () => {
        originalAspectRatio = img.width / img.height;
        originalImageWidth = img.width;
        originalImageHeight = img.height;
        
        const maxScreenWidth = window.innerWidth * 0.75;
        const maxScreenHeight = window.innerHeight * 0.75;
        
        let width = maxScreenWidth;
        let height = width / originalAspectRatio;
        
        if (height > maxScreenHeight) {
            height = maxScreenHeight;
            width = height * originalAspectRatio;
        }
        
        const left = (window.innerWidth - width) / 2;
        const top = (window.innerHeight - height) / 2;
        
        requestAnimationFrame(() => {
            popupContent.style.width = `${width}px`;
            popupContent.style.height = `${height}px`;
            popupContent.style.left = `${left}px`;
            popupContent.style.top = `${top}px`;
            bringToFront(popup);
        });
    };
    img.src = imgSrc;
}

function closePopup() {
    const index = popupStack.indexOf(popup);
    if (index !== -1) {
        popupStack.splice(index, 1);
    }
    popup.style.display = 'none';
    popupImage.src = '';
    
    // Nascondi "street_b/w"
    if (popupStack.length === 0) {
        console.log("Nascondo street_b/w");
        streetNameElement.classList.remove('visible'); // Nascondi street_b/w
        
        // Mostra grispex solo se i box sono grandi (>= 280px)
        if (config.boxSize >= 280) {
            console.log("Mostro grispex");
            nameElement.style.display = 'block'; // Mostra grispex
        }
    }
}

// Funzione per verificare se il click è all'interno di qualsiasi popup
function isClickInsideAnyPopup(e) {
    return popupStack.some(popup => {
        const content = popup.querySelector('.popup-content');
        const rect = content.getBoundingClientRect();
        return e.clientX >= rect.left && e.clientX <= rect.right &&
               e.clientY >= rect.top && e.clientY <= rect.bottom;
    });
}

// Mappatura delle immagini disponibili per ogni cartella numerata
const folderImages = {
    2: [
        '2/DSC01743 - dimensioni grandi.jpeg',
        '2/DSC01744 - dimensioni grandi.jpeg'
    ],
    3: [
        '3/DSC_2881 - dimensioni grandi.jpeg',
        '3/DSC_2928 - dimensioni grandi.jpeg',
        '3/DSC_2954 - dimensioni grandi.jpeg'
    ],
    5: [
        '5/_17_00199 - dimensioni grandi.jpeg',
        '5/_35_00217 - dimensioni grandi.jpeg',
        '5/11A_00194 - dimensioni grandi.jpeg',
        '5/12A_00195 - dimensioni grandi.jpeg'
    ],
    8: [
        '8/_13_02107 - dimensioni grandi.jpeg',
        '8/_29_02123 - dimensioni grandi.jpeg'
    ],
    9: [
        '9/---_01255 - dimensioni grandi.jpeg',
        '9/---_01262 - dimensioni grandi.jpeg',
        '9/---_01272 - dimensioni grandi.jpeg',
        '9/---_01274 - dimensioni grandi.jpeg'
    ],
    10: [
        '10/000010800004 - dimensioni grandi.jpeg',
        '10/000010800006 - dimensioni grandi.jpeg',
        '10/000010800007 - dimensioni grandi.jpeg'
    ],
    11: [
        '11/__8_00191 - dimensioni grandi.jpeg',
        '11/_16_00198 - dimensioni grandi.jpeg',
        '11/_31_00213 - dimensioni grandi.jpeg',
        '11/_6A_00190 - dimensioni grandi.jpeg'
    ],
    12: [
        '12/_11_01454 - dimensioni grandi.jpeg',
        '12/_17_01448 - dimensioni grandi.jpeg'
    ],
    13: [
        '13/---_01256 - dimensioni grandi.jpeg',
        '13/---_01260 - dimensioni grandi.jpeg',
        '13/---_01267 - dimensioni grandi.jpeg'
    ],
    16: [
        '16/__4_01461 - dimensioni grandi.jpeg',
        '16/__5_01460 - dimensioni grandi.jpeg',
        '16/_25_01440 - dimensioni grandi.jpeg'
    ],
    17: [
        '17/__4_00137 - dimensioni grandi.jpeg',
        '17/__5_00138 - dimensioni grandi.jpeg',
        '17/__6_00139 - dimensioni grandi.jpeg',
        '17/__7_00140 - dimensioni grandi.jpeg'
    ],
    18: [
        '18/SDC10012 - dimensioni grandi.jpeg',
        '18/SDC10013 - dimensioni grandi.jpeg',
        '18/SDC10036 - dimensioni grandi.jpeg',
        '18/SDC10043 - dimensioni grandi.jpeg'
    ],
    20: [
        '20/_14_02108 - dimensioni grandi.jpeg',
        '20/_15_02109 - dimensioni grandi.jpeg',
        '20/15A_02110 - dimensioni grandi.jpeg'
    ],
    21: [
        '21/100_3122 - dimensioni grandi.jpeg',
        '21/100_3129 - dimensioni grandi.jpeg',
        '21/100_3130 - dimensioni grandi.jpeg',
        '21/100_3155 - dimensioni grandi.jpeg'
    ],
    22: [
        '22/_5A_00896-2 - dimensioni grandi.jpeg',
        '22/_8A_00899 - dimensioni grandi.jpeg',
        '22/12A_00903 - dimensioni grandi.jpeg',
        '22/14A_00905 - dimensioni grandi.jpeg',
        '22/16A_00907 - dimensioni grandi.jpeg'
    ],
    23: [
        '23/18A_00909 - dimensioni grandi.jpeg',
        '23/26A_00916-2 - dimensioni grandi.jpeg'
    ]
};

// Funzione per estrarre il numero del box dal percorso dell'immagine
function getBoxNumber(imgSrc) {
    // Estrae il numero dal percorso, es. "cover/8.jpeg" -> 8
    const match = imgSrc.match(/cover\/(\d+)\.jpeg/);
    return match ? parseInt(match[1], 10) : null;
}

// Funzione helper per normalizzare i percorsi (rende i percorsi assoluti per GitHub Pages)
function normalizePath(path) {
    // Se il percorso inizia già con / o http, non modificarlo
    if (path.startsWith('/') || path.startsWith('http')) {
        return path;
    }
    // Altrimenti, rendilo relativo alla root del sito
    // Questo funziona sia per GitHub Pages che per sviluppo locale
    return path.startsWith('./') ? path : `./${path}`;
}

// Funzione aggiornata per ottenere tutte le immagini da caricare per un box
function getImagesForBox(imgSrc) {
    const boxNumber = getBoxNumber(imgSrc);
    // Sempre prima la copertina cover/X.jpeg
    let images = [normalizePath(imgSrc)];
    // Se esiste una cartella per questo box, aggiungi le immagini della cartella
    if (boxNumber && folderImages[boxNumber]) {
        // Aggiungi il prefisso 'foto/' e normalizza i percorsi
        const folderImagesWithPath = folderImages[boxNumber].map(imgPath => normalizePath(`foto/${imgPath}`));
        images = [normalizePath(imgSrc), ...folderImagesWithPath];
    }
    return images;
}

// Funzione per rilevare se siamo su mobile
function isMobile() {
    return window.innerWidth <= 768;
}

// Variabili per il carousel mobile
let mobileCarousel = null;
let mobileCarouselContainer = null;
let currentCarouselIndex = 0;
let carouselImages = [];
let touchStartX = 0;
let touchEndX = 0;
let isCarouselDragging = false;
let carouselStartX = 0;
let carouselCurrentX = 0;

// Funzione per creare il carousel mobile
function createMobileCarousel(images) {
    // Rimuovi carousel esistente se presente
    if (mobileCarousel) {
        mobileCarousel.remove();
    }
    
    carouselImages = images;
    currentCarouselIndex = 0;
    
    // Crea il container principale
    mobileCarousel = document.createElement('div');
    mobileCarousel.className = 'mobile-carousel';
    
    // Crea il container delle immagini
    mobileCarouselContainer = document.createElement('div');
    mobileCarouselContainer.className = 'mobile-carousel-container';
    
    // Crea gli item per ogni immagine
    images.forEach((imgSrc, index) => {
        const item = document.createElement('div');
        item.className = 'mobile-carousel-item';
        
        const img = document.createElement('img');
        img.src = imgSrc;
        img.alt = `Immagine ${index + 1}`;
        
        item.appendChild(img);
        mobileCarouselContainer.appendChild(item);
    });
    
    mobileCarousel.appendChild(mobileCarouselContainer);
    
    // Crea il pulsante di chiusura
    const closeBtn = document.createElement('button');
    closeBtn.className = 'mobile-carousel-close';
    closeBtn.innerHTML = '×';
    closeBtn.addEventListener('click', closeMobileCarousel);
    mobileCarousel.appendChild(closeBtn);
    
    // Crea gli indicatori
    const indicator = document.createElement('div');
    indicator.className = 'mobile-carousel-indicator';
    images.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.className = 'mobile-carousel-dot';
        if (index === 0) dot.classList.add('active');
        indicator.appendChild(dot);
    });
    mobileCarousel.appendChild(indicator);
    
    // Aggiungi al body
    document.body.appendChild(mobileCarousel);
    
    // Aggiorna la posizione iniziale
    updateCarouselPosition();
    
    // Aggiungi event listeners per swipe
    setupCarouselSwipe();
    
    // Nascondi grispex
    nameElement.style.display = 'none';
}

// Funzione per aggiornare la posizione del carousel
function updateCarouselPosition() {
    if (!mobileCarouselContainer) return;
    
    const translateX = -currentCarouselIndex * 100;
    mobileCarouselContainer.style.transform = `translateX(${translateX}%)`;
    
    // Aggiorna gli indicatori
    const dots = mobileCarousel.querySelectorAll('.mobile-carousel-dot');
    dots.forEach((dot, index) => {
        if (index === currentCarouselIndex) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

// Funzione per chiudere il carousel mobile
function closeMobileCarousel() {
    if (mobileCarousel) {
        mobileCarousel.remove();
        mobileCarousel = null;
        mobileCarouselContainer = null;
        
        // Mostra grispex se i box sono grandi
        if (config.boxSize >= 280) {
            nameElement.style.display = 'block';
        }
    }
}

// Funzione per impostare lo swipe del carousel
function setupCarouselSwipe() {
    if (!mobileCarousel) return;
    
    let startX = 0;
    let currentX = 0;
    let isDragging = false;
    
    mobileCarousel.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        isDragging = true;
        mobileCarouselContainer.style.transition = 'none';
    }, { passive: true });
    
    mobileCarousel.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        currentX = e.touches[0].clientX;
        const diff = currentX - startX;
        const translateX = -currentCarouselIndex * 100 + (diff / window.innerWidth) * 100;
        mobileCarouselContainer.style.transform = `translateX(${translateX}%)`;
    }, { passive: true });
    
    mobileCarousel.addEventListener('touchend', (e) => {
        if (!isDragging) return;
        isDragging = false;
        mobileCarouselContainer.style.transition = 'transform 0.3s ease-out';
        
        const diff = currentX - startX;
        const threshold = window.innerWidth * 0.2; // 20% dello schermo
        
        if (Math.abs(diff) > threshold) {
            if (diff > 0 && currentCarouselIndex > 0) {
                // Swipe a destra - vai all'immagine precedente
                currentCarouselIndex--;
            } else if (diff < 0 && currentCarouselIndex < carouselImages.length - 1) {
                // Swipe a sinistra - vai all'immagine successiva
                currentCarouselIndex++;
            }
        }
        
        updateCarouselPosition();
    }, { passive: true });
}

// Event Listeners
document.querySelectorAll('.project').forEach((project, index) => {
    project.addEventListener('click', (e) => {
        const img = project.querySelector('img');
        
        // Ottieni tutte le immagini per questo box (dalla cartella se esiste, altrimenti solo l'immagine del box)
        const images = getImagesForBox(img.src);
        
        // Su mobile usa il carousel, su desktop usa i popup
        if (isMobile()) {
            createMobileCarousel(images);
        } else {
            // Crea i popup solo se non esistono già
            if (popupStack.length === 0) {
                // Crea i popup con le immagini
                images.forEach(imgSrc => {
                    createPopup(imgSrc);
                });
                isMultiPopupMode = true;

                // Nascondi "grispex" e mostra "street_b/w"
                console.log("Nascondo grispex");
                nameElement.style.display = 'none'; // Nascondi grispex
                streetNameElement.classList.add('visible'); // Mostra street_b/w
            } else {
                // Usa createPopup invece di openPopup per uniformare il comportamento
                if (popupStack.indexOf(popup) === -1) {
                    images.forEach(imgSrc => {
                        createPopup(imgSrc);
                    });
                }
            }
        }
        e.stopPropagation();
    });
});

// Event listener globale per chiudere tutti i popup quando si clicca fuori
document.addEventListener('mousedown', (e) => {
    // Non chiudere se si clicca dentro un popup, sull'overlay, o su un elemento interattivo
    if (isClickInsideAnyPopup(e) || e.target === overlay) {
        return;
    }
    
    // Non chiudere se si sta trascinando o ridimensionando
    if (isDragging || isResizing) {
        return;
    }
    
    // Chiudi tutti i popup
    closeAllPopups();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (isMobile() && mobileCarousel) {
            closeMobileCarousel();
        } else {
            closeAllPopups();
        }
    }
});

document.addEventListener('touchstart', (e) => {
    if (e.touches.length > 1) {
        e.preventDefault();
    }
}, { passive: false });

const throttledPinch = throttle(handlePinch, 16);

document.addEventListener('mousemove', (e) => {
    // Disabilita il movimento della griglia su mobile
    if (isMobile()) return;
    
    lastKnownMouseX = e.clientX;
    lastKnownMouseY = e.clientY;
    updatePosition();
}, { passive: true });

document.addEventListener('touchmove', (e) => {
    // Disabilita il pinch zoom su mobile
    if (isMobile()) return;
    
    if (e.touches.length === 2) {
        throttledPinch(e);
    }
}, { passive: false });

document.addEventListener('touchend', () => {
    config.lastPinchDistance = 0;
}, { passive: true });

let timeout;
document.addEventListener('mouseleave', () => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
        grid.style.transform = 'translate3d(0, 0, 0) scale(1)';
    }, 300);
}, { passive: true });

document.addEventListener('gesturestart', (e) => {
    e.preventDefault();
}, { passive: false });

// Ottimizzazione caricamento immagini
document.querySelectorAll('.project img').forEach(img => {
    img.loading = 'lazy';
    img.decoding = 'async';
});

// Inizializzazione
updateGridProperties();

// Aggiungi gli event listener per il popup singolo
document.querySelectorAll('.resize-handle').forEach(handle => {
    handle.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        const handleClass = Array.from(handle.classList)
            .find(className => className !== 'resize-handle');
        const targetPopup = handle.closest('.popup-container');
        bringToFront(targetPopup);
        initResize(e, handleClass, targetPopup.querySelector('.popup-content'));
    }, { passive: false });
});

popupContent.addEventListener('mousedown', (e) => {
    if (e.target === popupContent || e.target === popupImage) {
        e.stopPropagation();
        bringToFront(popup);
        initDrag(e, popupContent);
    }
}, { passive: false });

// Gestione dell'overlay
function showOverlay() {
    overlay.style.display = 'block';
}

function hideOverlay() {
    overlay.style.display = 'none';
}

// Chiudi tutti i popup
function closeAllPopups() {
    // Rimuovi tutti i popup dallo stack
    while (popupStack.length > 0) {
        const p = popupStack.pop();
        if (p && p.parentNode) {
            p.remove();
        }
    }
    
    // Rimuovi anche tutti gli altri popup-container che potrebbero essere rimasti nel DOM
    // (per sicurezza, nel caso alcuni non siano nello stack)
    const allPopups = document.querySelectorAll('.popup-container');
    allPopups.forEach(p => {
        // Non rimuovere il popup iniziale (quello con id="imagePopup"), solo nasconderlo
        if (p.id !== 'imagePopup' && p.parentNode) {
            p.remove();
        }
    });
    
    // Nascondi anche il popup iniziale se presente
    if (popup) {
        popup.style.display = 'none';
        if (popupImage) {
            popupImage.src = '';
        }
    }
    
    // Nascondi street_b/w
    streetNameElement.classList.remove('visible');
    
    // Mostra grispex solo se i box sono grandi (>= 280px)
    if (config.boxSize >= 280) {
        nameElement.style.display = 'block';
    }
    
    closePopup(); // Chiama closePopup per gestire la visibilità di grispex
    hideOverlay();
    isMultiPopupMode = false;
}

// Aggiungi l'event listener per l'overlay
overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
        closeAllPopups();
    }
});

// Gestione click sul titolo - disabilitata
// nameElement.addEventListener('click', (e) => {
//     e.preventDefault();
//     window.location.href = './about.html';
// });

// Aggiungi l'event listener per il mouse wheel
document.addEventListener('wheel', (e) => {
    e.preventDefault(); // Previeni il comportamento di default dello scroll

    const delta = Math.sign(e.deltaY); // Determina la direzione dello scroll
    let newBoxSize;

    if (delta < 0) { // Scroll verso il basso
        newBoxSize = config.boxSize * 1.5; // Aumenta la dimensione del 50%
    } else { // Scroll verso l'alto
        newBoxSize = config.boxSize / 1.5; // Riduci la dimensione
    }

    // Limita la dimensione della griglia
    if (newBoxSize >= 150 && newBoxSize <= 500) { // Limita la dimensione tra 150px e 500px
        config.boxSize = newBoxSize;
        config.userChangedSize = true; // Indica che l'utente ha modificato la dimensione manualmente
        updateGridProperties(); // Aggiorna le proprietà della griglia
        
        // Resetta la posizione della griglia per evitare problemi di visualizzazione
        grid.style.transform = 'translate3d(0, 0, 0) scale(1)';
        
        // Nascondi/mostra "grispex" in base alla dimensione dei box
        if (newBoxSize < 280) {
            nameElement.style.display = 'none';
        } else {
            nameElement.style.display = 'block';
        }
    }
});

// Gestione resize della finestra
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        // Riadatta solo se l'utente non ha modificato manualmente la dimensione
        if (!config.userChangedSize) {
            resizeGridToFitWindow();
        }
    }, 150); // Debounce per evitare troppi aggiornamenti
});

