import React from 'react';
import { Clock, MapPin } from 'lucide-react';
import classes from './ConcertInfo.module.css';

const ConcertInfo = () => {
    const setlist = {
        part1: [
            { id: 1, title: "비틀비틀짝짜꿍", artist: "한로로" },
            { id: 2, title: "대화가 필요해", artist: "자두" },
            { id: 3, title: "눈이 오잖아", artist: "이무진" },
            { id: 4, title: "밤이 깊었네", artist: "크라잉넛" },
            { id: 5, title: "무희", artist: "Vaundy" },
            { id: 6, title: "각자의 밤", artist: "나상현씨밴드" },
            { id: 7, title: "지금부터", artist: "Hebi" },
            { id: 8, title: "Drowning", artist: "Woodz" },
            { id: 9, title: "Highlight", artist: "Touched" },
            { id: 10, title: "Antifreeze", artist: "검정치마" }
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
                        <p className={classes.smallText}>오후 7시</p>
                    </div>
                </div>
                <div className={classes.infoRow}>
                    <MapPin className={classes.icon} />
                    <div>
                        <h3>장소</h3>
                        <p>라디오가가 라이브홀</p>
                        <p className={classes.smallText}>(서울특별시 마포구 서교동 양화로11길 54)</p>
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
                    Intermission (15분)
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
