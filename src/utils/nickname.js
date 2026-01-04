const ADJECTIVES = [
    "노래하는", "춤추는", "박수치는", "설레는",
    "행복한", "즐거운", "기대하는", "소리치는",
    "감동받은", "수줍은", "열정적인", "우아한"
];

const CHARACTERS = [
    "라이언", "무지", "어피치", "프로도",
    "네오", "튜브", "제이지", "콘",
    "춘식이", "죠르디"
];

export const generateNickname = () => {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const char = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
    return `${adj} ${char}`;
};
