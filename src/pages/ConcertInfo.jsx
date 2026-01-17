import React from 'react';
import { Clock, MapPin } from 'lucide-react';
import classes from './ConcertInfo.module.css';

const ConcertInfo = () => {
    const setlist = {
        part1: [
            { id: 1, title: "기억을 걷는 시간", artist: "넬" },
            { id: 2, title: "고백", artist: "델리스파이스" },
            { id: 3, title: "혜성", artist: "윤하" },
            { id: 4, title: "Pretender", artist: "오피셜 히게단디즘" },
            { id: 5, title: "여우야", artist: "더클래식" },
            { id: 6, title: "슈퍼스타", artist: "이한철" },
            { id: 7, title: "Last Night on Earth", artist: "Green Day" },
            { id: 8, title: "이 밤이 지나면", artist: "김연우" },
            { id: 9, title: "Don't Look Back in Anger", artist: "Oasis" }
        ],
        part2: [
            { id: 11, title: "검을 현", artist: "이승윤" },
            { id: 12, title: "Oddities", artist: "The Poles" },
            { id: 13, title: "용의자", artist: "한로로" },
            { id: 14, title: "Ditto", artist: "NewJeans" },
            { id: 15, title: "만찬가", artist: "tuki." },
            { id: 16, title: "It's My Life", artist: "Bon Jovi" },
            { id: 17, title: "bad", artist: "wave to earth" },
            { id: 18, title: "Stargazing", artist: "The Poles" },
            { id: 19, title: "아지랑이", artist: "쏜애플" }
        ]
    };

    return (
        <div className={classes.container}>


            <div className={classes.infoCard}>
                <div className={classes.infoRow}>
                    <Clock className={classes.icon} />
                    <div>
                        <h3>일시</h3>
                        <p>2026년 1월 31일 (토)</p>
                        <p className={classes.smallText}>오후 5시30분</p>
                    </div>
                </div>
                <div className={classes.infoRow}>
                    <MapPin className={classes.icon} />
                    <div>
                        <h3>장소</h3>
                        <p>그림라이브하우스</p>
                        <p className={classes.smallText}>(서울 서대문구 연희로 14 B1층)</p>
                    </div>
                </div>
            </div>

            <div className={classes.setlistContainer}>
                <div className={classes.part}>
                    <h3 className={classes.partTitle}>Wave</h3>
                    <ul className={classes.list}>
                        {setlist.part1.map(item => (
                            <li key={item.id} className={classes.item}>
                                <span className={classes.songTitle}>{item.title}</span>
                                <span className={classes.artist}>{item.artist}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className={classes.intermission}>
                    Intermission
                </div>

                <div className={classes.part}>
                    <h3 className={classes.partTitle}>Atempo</h3>
                    <ul className={classes.list}>
                        {setlist.part2.filter(i => i.title !== 'Intermission').map(item => (
                            <li key={item.id} className={classes.item}>
                                <span className={classes.songTitle}>{item.title}</span>
                                <span className={classes.artist}>{item.artist}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default ConcertInfo;
