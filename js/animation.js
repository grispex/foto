// Costanti e variabili globali
const leftText = "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium totam rem aperiam eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Ut enim ad minima veniam quis nostrum exercitationem ullam corporis suscipit laboriosam nisi ut aliquid ex ea commodi consequatur quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur vel illum qui dolorem eum fugiat quo.";

class TextAnimation {
    constructor() {
        this.leftBlock = document.getElementById('textBlockLeft');
        this.typingArea = document.querySelector('.typing-area');
        this.aboutTitle = document.querySelector('.about-title');
        this.isTyping = false;
        this.currentText = '';
        this.typingInterval = null;
        this.currentIndex = 0;
        this.isCancelling = false;

        this.init();
    }

    init() {
        this.typingArea.addEventListener('mouseenter', () => this.handleMouseEnter());
        this.typingArea.addEventListener('mouseleave', () => this.handleMouseLeave());
    }

    checkTextOverlap() {
        const titleRect = this.aboutTitle.getBoundingClientRect();
        const leftBlockRect = this.leftBlock.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        
        const charWidth = 8.1;
        const textWidth = this.currentText.length * charWidth;
        const textPosition = leftBlockRect.left + textWidth;
        
        const activationDistance = titleRect.left - 15;
        
        if (textPosition > activationDistance && this.currentIndex > 0 && !this.isCancelling) {
            const charsPerLine = Math.floor((windowWidth - leftBlockRect.left - 50) / charWidth);
            const currentLine = Math.floor(this.currentText.length / charsPerLine);
            const charsInCurrentLine = this.currentText.length % charsPerLine;
            
            let newX = textPosition + 15;
            
            if (newX > windowWidth - 50) {
                if (charsInCurrentLine < 3) {
                    const newTextPosition = leftBlockRect.left + (charsInCurrentLine * charWidth);
                    this.aboutTitle.style.transform = `translate(${newTextPosition - windowWidth/2 + 15}px, calc(-50% + ${(currentLine + 1) * 3}rem))`;
                }
            } else {
                this.aboutTitle.style.transform = `translate(${newX - windowWidth/2}px, calc(-50% + ${currentLine * 3}rem))`;
            }
        } else if (this.currentIndex === 0 || this.isCancelling) {
            this.aboutTitle.style.transform = 'translate(-50%, -50%)';
        }
    }

    typeText() {
        if (this.currentIndex < leftText.length) {
            this.currentText = leftText.substring(0, this.currentIndex + 1);
            this.leftBlock.querySelector('p').textContent = this.currentText;
            this.currentIndex++;
            requestAnimationFrame(() => this.checkTextOverlap());
        } else {
            clearInterval(this.typingInterval);
            this.isTyping = false;
        }
    }

    unTypeText() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.currentText = leftText.substring(0, this.currentIndex);
            this.leftBlock.querySelector('p').textContent = this.currentText;
            requestAnimationFrame(() => this.checkTextOverlap());
        } else {
            clearInterval(this.typingInterval);
            this.isTyping = false;
            this.isCancelling = false;
            this.leftBlock.style.opacity = '0';
            this.aboutTitle.style.transform = 'translate(-50%, -50%)';
        }
    }

    handleMouseEnter() {
        if (this.isCancelling) {
            clearInterval(this.typingInterval);
            this.isCancelling = false;
        }
        this.leftBlock.style.opacity = '1';
        this.isTyping = true;
        this.typingInterval = setInterval(() => this.typeText(), 40);
    }

    handleMouseLeave() {
        clearInterval(this.typingInterval);
        this.isCancelling = true;
        this.typingInterval = setInterval(() => this.unTypeText(), 25);
    }
}

// Inizializza l'animazione quando il DOM è caricato
document.addEventListener('DOMContentLoaded', () => {
    new TextAnimation();
}); 