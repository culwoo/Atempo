import React from 'react';
import { Clock, MapPin } from 'lucide-react';
import classes from './ConcertInfo.module.css';

const ConcertInfo = () => {
    const setlist = {
        part1: [
            { id: 1, title: "기억을 걷는 시간", artist: "넬" },
            { id: 2, title: "고백", artist: "델리스파이스" },
            { id: 3, title: "혜성", artist: "윤하" },
            { id: 4, title: "Pretender", artist: "Official髭男dism" },
            { id: 5, title: "여우야", artist: "더클래식" },
            { id: 6, title: "슈퍼스타", artist: "이한철" },
            { id: 7, title: "Last Night on Earth", artist: "Green Day" },
            { id: 8, title: "이 밤이 지나면", artist: "김연우" },
            { id: 9, title: "Don't Look Back in Anger", artist: "Oasis" }
        ],
        part2: [
            { id: 11, title: "파도", artist: "새소년" },
            { id: 12, title: "저녁을 사랑하겠어", artist: "연정" },
            { id: 13, title: "사랑의 미학", artist: "리도어" },
            { id: 14, title: "PINK TOP", artist: "The Volunteers" },
            { id: 15, title: "S.A.D", artist: "The Volunteers" },
            { id: 16, title: "꿈을 꾸는 소녀", artist: "Xdinary Heroes" },
            { id: 17, title: "바이, 썸머", artist: "아이유" },
            { id: 18, title: "오늘이야", artist: "유다빈밴드" },
            { id: 19, title: "Just the two of us", artist: "Bill Withers 및 Grover Washington, Jr." },
            { id: 20, title: "한시 오분", artist: "검정치마" },
            { id: 21, title: "백일몽", artist: "유다빈밴드" },
            { id: 22, title: "annie.", artist: "wave to earth" },
            { id: 23, title: "SQUARE", artist: "백예린" },
            { id: 24, title: "행운을 빌어요", artist: "페퍼톤스" },
            { id: 25, title: "FIND ME!", artist: "The Poles" },
            { id: 26, title: "Welcome to the Black Parade", artist: "My Chemical Romance" }
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
                    <div className={classes.intermissionLine}></div>
                    <span className={classes.intermissionText}>Intermission</span>
                    <div className={classes.intermissionLine}></div>
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
