import { useEffect, useRef, useState } from "react";
import { type AppProps, tr } from "../i18n";
import { POSTS, PROFILE, type Post, type Profile } from "../story";
import { uid, usePersist } from "../store";
import { label, confirmDelete } from "../labels";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, Plus, Trash2, Home, Search, User, Heart, MessageCircle, Send, Bookmark, ArrowLeft, MoreHorizontal, Clapperboard, ChevronLeft } from "lucide-react";
import { postImages, moveImage } from "../media";
import { sendChat } from "../conversation";
import { Stories, InstagramDM } from "./InstagramSocial";
import { SELF_ID, FRIEND_ACCOUNTS, FRIEND_POSTS, ACCOUNTS_KEY, FRIEND_POSTS_KEY, socialFeed, authorPosts, type SocialPost, type SocialAccount } from "../social";
import { STORY_DATE } from "../chronology";
import { BackBtn, EditBar, Field, ImageField, TopBar, resolveImg } from "../ui";
import { useOwner } from "../owner";
import { withLocalInteraction } from "../shared-state";
import { instagramCaption, editInstagramCaption } from "../instagram-language";
import { readNewStory, updateNewStory } from "../new-story";

export default function Instagram({ lang, onHome, initialDmContactId, onAntonPostViewed }: AppProps & { initialDmContactId?: string | null; onAntonPostViewed?: () => void }) {
  const owner = useOwner();
  const [tab, setTab] = useState<"home" | "search" | "profile">("home");
  const [dm, setDm] = useState(false);
  useEffect(() => { if (initialDmContactId) setDm(true); }, [initialDmContactId]);
  const [activity, setActivity] = useState(false);
  const [newFollowerUnread, setNewFollowerUnread] = useState(true);
  const [followedYuna, setFollowedYuna] = usePersist<boolean>("ig-follow-yuna-v1", false);
  const [showYunaDmPrompt, setShowYunaDmPrompt] = useState(false);
  const [query, setQuery] = useState("");
  const [comment, setComment] = useState("");
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [shareId, setShareId] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState<{ id: string; text: string } | null>(null);
  const [posts, setPosts] = usePersist<Post[]>("ig-posts-v1", POSTS);
  const [friendPosts, setFriendPosts] = usePersist<SocialPost[]>(FRIEND_POSTS_KEY, FRIEND_POSTS);
  const [accounts, setAccounts] = usePersist<SocialAccount[]>(ACCOUNTS_KEY, FRIEND_ACCOUNTS);
  // Add new fictional friend posts and migrate the bundled image for Yuna's
  // 2026-10-31 post in older saved feeds, while preserving all user-edited fields.
  useEffect(() => {
    setFriendPosts((current) => {
      const yunaSeed = FRIEND_POSTS.find((post) => post.id === "friend-yuna-back-20261031");
      const migrated = yunaSeed
        ? current.map((post) => post.id === yunaSeed.id ? { ...post, image: yunaSeed.image } : post)
        : current;
      const ids = new Set(migrated.map((post) => post.id));
      const additions = FRIEND_POSTS.filter((post) => !ids.has(post.id));
      return additions.length ? [...migrated, ...additions] : migrated;
    });
  }, [setFriendPosts]);
  // Restore newly added fictional accounts into older saved lists without overwriting existing edits.
  useEffect(() => {
    setAccounts((current) => current.some((a) => a.id === "yuna") ? current.map((a) => a.id === "yuna" ? { ...a, ...((a.avatar === "img:campus" || a.avatar.startsWith("data:image/svg+xml")) ? { avatar: FRIEND_ACCOUNTS.find((x) => x.id === "yuna")!.avatar } : {}), isPrivate: true } : a) : [...current, FRIEND_ACCOUNTS.find((a) => a.id === "yuna")!]);
  }, [setAccounts]);
  const [profileId, setProfileId] = useState(SELF_ID);
  const [prof, setProf] = usePersist<Profile>("ig-profile-v1", PROFILE);
  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Post | null>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [profDraft, setProfDraft] = useState<Profile | null>(null);
  const S = tr(lang, { en: "Save", ko: "저장", zh: "保存" });
  const C = tr(lang, { en: "Cancel", ko: "취소", zh: "取消" });
  // This post was explicitly removed. Filter legacy local/shared copies as well
  // as the bundled seed so the deleted Seongsu café entry cannot reappear.
  const visiblePosts = posts.filter((p) => !(p.id === "p7" || (p.date === "2025-09-06" && /성수|咖啡店|cafe/i.test(p.caption))));
  const storyEndingPost = readNewStory().stage >= 11 ? ({ id: "new-story-anton-ending-post", authorId: "anton", image: "data:image/webp;base64,UklGRq4VAABXRUJQVlA4IKIVAABwtQCdASpAAasBPymIu1cuKL+zKHKb4/AlCWVuvciX03zmsRwPgHiFV09xfXMrT3fn/HzX7PAH8mHukWDM6pemuLn/TdZnVFGM+cgYhBZphtc+irbBRDDZzmwdAt4IfO95zCuybgMSwnl8+1c5InbIdrn9+V8ieYA5Lu4qwng0EMfzMhopXhAP12TpcPKVjVqf50P1SpbSPj/CJ55YrAbCTDYoWloTZlWC8blfFrCRGXfiBl5qUgcQtUtChfOlJkZabYtvTj+vFgSkYoiWMQDAJdaDyotss9u3t4CvDWEXwbqWNgj1HyXLZKdMIXUvjRu4Ggl4th/+OMWkQ4MMfI3ACc3g892CNBCrAkZ+sJVwpsb5TVzEdBMxHbXwkggbHtB2QnR5I6Epx1uHkqMKH7EfTHi/4+yf9XY8gSzV1Wn9rdReSmw/xDSPteoQAHWzApuEgzSgxIhXa6FmIb6AS7Pi7/dkogX0cRJNCf++44+VzfLVF1nUOhOszgptsWTJlx4ytwhZM/RZ1+3cx6jpyDFWXcHxUvuoTYPkgJMZDCVrTQvJbjmdOb8brAJ4IuE2KqaLiO53hXMpDeH1AuGoz1zfRrXooip62L7lAXPTOWjytijTrVwD9nBnToHeHaNAf/Ts2OrE1LTs8FF8/T1Z9Gfiip1LFlhRNN7OlpPVKEZ95rcsrp6V+eVDm1mGkkgKvO9jj4swssPKOuRvWQYIzlvdMUXXxw1anhyz7NpCdgmNYKP0rM1leYqI2dXnaj4yNE707L9HDiodq1j/8WYzs6YhEt5x/K/Ob33a+uFV2h6+/pQxqQfWy6OCYg3nwAD6rICyaDaxg0U7xHS4R+pTSkEZKa3R5uE+jPwOym50nmSyzdDERS1YdVPTSxuTQ5v+yuuZW1DcVYJyvynWfSq2sLdgCCuojj0rPf0uZIjKAit5bPAaHXJfi/MGU3VeyUYd0UGOKZDgLJlSBqVz/C9AWxk2ZLqDNJ0S7be20tcJKw2h5UrthusD4emSyngAgkNI1R/r6JLvutMjqUM8tAUbhUQPBHq8u1+1Df0LwdmHhhmBs80/MtdtzyhM5qIyHoV5DlhvGHpjBo96Mmy6aGYlZjyvIIqz0cf6UbHkNMkdHAIk+XLFpGdXFGXiAaYYeisC3vKO2JyB/XBIhP9OtqPKFeGxE0pICMwLTYhdn7ZUJt92pBVZEEm2eBqUNSO5FPXBcoeO25S4SsaFO509wAB8mNlTVmz6YMSdqtmZZR3kJEh381Abf/k0KHRT1UARHZH7ZqKpPtCxrtBX10+xGfsAd9SN9b6DhLngSMkKbTAOdOx/Wi7rgrXsq3zfLUFyVZ6p1zNbMA/LqdT54RoDLOXar61DxAiDggTrrd0T5autzdbr2UoZcK4fgwu4PIgBBjXeqSUMqyLBp1ee1MGGY/lzZPMsAan1qduzliDc+etx/QN7cVSmvMbQG4Y4nWTEso0XEkK6pfMv46odDDkW//ppUeAaRPY7wUvHxBLfHl7uhsWkapnmDFd9ZNdDsMFOUVFIXAuFGJp9DktMFpur4DbDRpNIcUODyVHx4DKGJxquQNjwMRkDgibRkMLupAMFSFKKOH1VmWs6LNSL23KgsRi+aHVmj2vCHWvhtn1INf0/zaqZFL3JvNuyyzEzxZiX5o6KQD2p2GGYjuWplSISQ7m5vfOvbWSv47SifKMuwKFN1b+A6q880Mi2l9MxQY5vkjZi4TMhBIsxNAHOmzpVRorQCU2atxMDjU4NIEz7IEhwphQE6I2Xrxhub1lcZhr8tue+t9/DTZIQQBN9gtFZY0tdQDVEf4ZqM0Up6eGKf15OjH/ZSeRz7koA2wpHO0PBKSNBjjNJFA9a0e3HvAM/kiGXbPUZ8B/wQTAS536AerYX/0N1pIuUd5EvqvLsmxg7zMByt2gzmF7V5LxInULapuEUVz+T1ZypoAD+mHrp5kEq9NahvOvyYiEURUlGbdh4fuoS0FRqdGM4QhBQbTzs1pUIMA6gfdIP0BsKGKDijrE3rq+RAIXLfMVkiDvLOqHTJbrU32tg/q/xFlQC1cxF2zUIwcOKLcb77TjjRXJhkoe8mZg6mWJ2i8MtGQqkcifJKJfuiue9jiV84K0uqk7nkM1MJLctsS3JmoeOagAA/Wj/19bHN4IDM5eaB5aDx8wYRsNFMWxazX1/3orFB6QC8Ltr/W1lQPnWshgj+6iHu2XqBKhvmaDk+t+XiEWXzENlMN0EWN7Pl3qN/D+oJtfMqFZG5xh5mcrJqBygns8gNZNmdNHsnnrURMtOOsSxeIKOCmuPaQj7c5mio9iFaHxTBzbYGCGa2Nyd7iurquYhsG8qBAMnZqP1gsskPW5S5HvEyegR4qU32bYh63/8yNkXQkANnPmeIbFdhNZmZ/rOrzOvI7GnvvL8poEUX9H2a6ESPmBuDiKSLGvNgw8lOroJInNPiZciAJrA3Nsze35V04tmRdn+mWo3DjPDFVco7EVJ3ymLHYsAQRRCJbECCsvN7lM6qF/FFJeCsJnEYBhNsGO0MlF9KU4ha5PNZINWPspeuyoABfe1FZampaP6/rc++5o/0X+IS1rlnyb+StxVBbYk2BJBm3QPU/MBP7s0e5BiiLrtG7mYKoRgaHBf2AcHLGRk4qRIOhuqGbYlbfjWLoABXZNp+xyIcxZwsha7m7sbVu90QKvNQZpdqSYeLAUKJMhZZ3CbVxazppX3u6UMBNHoOSPE6TM1I2uj/VcXz4iJYCtpFHFyjnvO0Wh/0EEgAABBggj7e+AyiQzlYMzBq4ugZTPOsn8YxkpJhXGafZ5DqYHmu4ME1zYBsMuEgh63MuH8QPX8zlpCAr4vrQaxgcmUlZe8icfSny2YZ3VIg+Hhfxf2woa1f/2EspSM6fv35z6k9KgHjembC2fSlwIV6Th4dDyz+9aMBne7ITVqFJuvmKBIlJhQMjfr7Zk+gAAI0sexpZLN6yj7HdQanZKF1dU3QbCqrAtdw2F8b/rgPBcEWB+oMT2yn/LwzSacEFjUWsi/j3c21sGu2a7ptkLMYI8Hr6y89z4mBTMMz8U5IBlx8jXyzkwjbc2bwiS110T8q0g+Bk/bImYZX1jIqoa/Tn0Zdlg+zYsr9sDEcro55UrvJFqWUdKS0AY/JrBFfNF8bzz2Z9dW8hdNr21sFqNHHdoiGvGLGcPbOp2la11ncEyis5YftdbJvMBWPvIPsCMLqClfjl6PzU/AADJgknG7XfClRpmoXdzL480t2AfDcRlcQgEzbtUbUXgrDaLwMNlGYYqwbiD83NBfLChh8tExyOamyQqmnYOXYczob2RAO5LAGJAsV4V0/U8Bc9wy0v070O0JYsLC7Xitc7+gbjDp0VWby3sN7cmSlvjQQ+qEw2viwFuiq3VbnpmUHIKndFTdIwAm+Mo+8hI7SVvWx5kkGErY5FKeFAL/0ZVOR2hNRhxWEKJs0qTcw96Pd6som92utsBEaR7lnRyQUwoUTEO+Q8zHYrkUe+Uye85pXXK10qiwOxRG2csXteVetniTIIj8c9fp2pnOoHO2tY7210svKwFGTPTE7Yu6hocad1tB54Ga8KS/kJiAZLER99B1G1lp6oK4lMsQrbQqCb7Emr8TitpE+aPyEA6HNmatKFgrDu2l1mBqYBumAELGsULjYlE7Pjj0hcuNilIyNQyo+ZE7qQAO3hEY+DvfPX+K06czebwacAmaqaZtJVymUnRgs49alsagDWERf+V2EqyeJEKLoxDIH+OmFwAZi00Dccf23Vml/2sDKHsnHnmgzXhzhoWGRb9fg0TAWWCgQafTtVAC+RF73v8FrgJkPVe7OtWBp7M7TgvUxLNJB4Afv/8AjK40kpJSN7unGdOpBbm8K1+JhsBWhV0RUDxS+SQ6PWRp8eM6I87sgO0rcieQfUAc9lQypmzZnY/bv3fJPjOdsHPusXb0e0bAs1z4HBLKwdWyn9LQeLx52eCqrb6dKRPB3wG397135nwdMrfbBy+sWLNGHYv4/OWPan+/SGDXIeJnmSSpfbkblQVsvxYtfBSEjc3OTk0l40QGw54eDULoE49nNKm0O1HcD2t2fapZVCA/ipKgbqv64bVQX6tYINEbCqYrPjefjo+E0nrcUmcSN5keoOYxooZwBdRh8mqccGZdAtCysrUK+TCkEQoN6uWH0JD3kLLlqIKHNCVsquSJ2+GzJ2PZfkq58hJx2CRuqPosfbte7KSpAppPQ0R1SKPRXrKXN67QaZzF8EQ99Tu8qBpzyzU0xOlEP506xtsUjjMhATQVm07mhbaq1az/9HgOXJ7kdsTsS5kBTFcs6fPFk84DynX4B3mKmYzfR6Td55R/vgtdp1gJwsjBSEpTpjoxrHWkNmADuvxbctgvkbaVkCO2I5B8bdet6c10FC5WE2pI/42Sljk0cN+UgqgX+kXNw9xXdXr6ttPGRC4PBZ72bjBQKqr/K2AwJVOL486Hy6DKPFX+vNe5cnsxO5DDgj41JsFt6x7HidD4nlwHm09vE0dijBGD48e5S4laeN5TknD94prDMq+FWlH0ZiKQmOu9woIcx1WhS6cLTmQ9xBj1Djbj68UC+gD+e2lcLzlh5wkWdeVURJuH3hOiXCjVjADq0ISDmApy8eypw03d9xWPW2E4FzJxxQgNlnQGKIPzgdzXo9NOwdxmDW+2FFzDBn4Uqq6YDZdOmR9zMWbQlzL4g1zhuScalOIQ5rgqRb81W+txP3tScQkd70E0kYRg0RfEd5Ky6vVdno3+u7InCrUc8FSXdjzaPOmbUzh+qccwxbCYoGPqOc/tGZjimS2ZU50eWkYaCxicUg7Rf2BbA5OVnRrTVFNBtuIjR04yNOVzAj+Db/dQ7SQzoKaLUMo3/v66qzGtGftP727pFLVqa4dvH0jYL+/28he0ehzUtGpo8doqJzA2T87AJEVUQKH1d3rCEUPVWybDtGUm/pg7J9YjnOwDeHkrCqAFgrMeuVQUrwTBy3PV5obDjKRpKjBuepa0XEqnSx1y5Yps9bAxyg66urVaC4tSfNQRGEcUsodkP40dQ0y1+HRnD2TzGHC0G4kNnvo/OKb1GMPRBqTUdg3IzppmU5TDwNQMpcF7gq1h67dLw7dXTG2wCOOHpXZoo4WuXRw8WADJkVIPw/PgjCqavpld7BFuAprk5rLwRTgrbHlyG2CC/PHVsSmJPOfvdM9QKczdOi6CUze+VMerlkOe0juRM1QV/f3zXZ6TpIrNjoUR595+35DD8ZnkWubbREZUjnBdHP4nZ2H1fY1/NKvwpa62zCwXqUPk7EYsSEEm97sAGywRf+AmuOtriBvoHANg7cLvEOfblnH2l+WUgep24Q+oopQ7utRMdLQCBRBsdVn0oZX3ol/5+R4E9/xRMe73JLTWXNmtKjqc57OapxmEhB0R3eGRq+zlT0hxhLNu0t++h3S1731NyFqxZsH6MzllyUFVrT8HOs5xYgkKDW8givcDYbYuSvkCYxFIpdFy+iG5K0DCH5qRriMjoRjKMP7zNeQcSJQxV8aj2URsl1awq9NTORiznaCz86cbWUoADZ+hympl/wzoZ+/0QzZh3I/wnTE1SB9Ejc8ifWDEv2vOhW95jYeY/knHqGcoraHjIim/Ibx2QWjRzxsQlQzwqd13r1aPFC/YkmlOl+XZcfzoRLZCu14qmpb4fMURIQkJFOxsf4KwWkq64YBWfoNWrJTwEJMBKu47NcE1FwNs2Pv2O+7w5ip9hHtIIxHU0GGVYrVuvU7PepI4wY6XLyUF/WGzhZNBUn87+qUB6xjkRvfzoqeFuZzLi0FaLyLzp6QzwpZmVPv6clKrlCOP8tIrNUV99jtpL3/vlRGQC8H/X5K2Xq+nCsGat6stmOG/xe2OOJkDLfl7oznsA5HLq8fm1OimNOzDjfinQKrS27sLU9BciOPg93pvCZnjR2MjDK1SBy2xh6iMIJqCFw506mGtUIQXhZEbqrUVGTsmqP6Ge5xKpUq0FCqKWS8e7NKtqofV1j6qNh93vZlTPT9p3a+3FM2PE2BK7fZQUgi7fm4zKekCilnRSpBXu3AwOLeNZ2K4jHF3NZMLvuOv2Ti3EzmS3Mbg0DIVAxGk6/lkuFe66KZV1wiE5YTw8u7MrNRVQIU2GN1jH7HLiLzhp2tHRILtVijvqYyHi97FSQWCNhHXqwvk++lf4n9jzaioi/6VUO5Ho5oN2pnW4f1hRGoR8ttgXt0xGs6c0U8yYKJxFFRwfJpobkONp1vM898sEtxQCNKtAFHiOzBLmJvRrwvNsnICJyuGGb1Lp9b5iY1i1FjhTKthdGDJqU5lmKutw+eVeaHpRJpBFr7LoteAtf2GFvo9xPIUzzPN+Gf/rtEqGpDwrmUHG7+z3gXISWT7PNU09YMBPOrENp7ZmxGrNA7EnSGQr8VF19vsfEPgVajYc8i6L8SnWP1WlNsPRHd6mZxQd6yrry0tHKIYiemwvQmsJrXYLFvBwnVeRv+0d6JNmXqY+UngBUd6Db4DIfJVzTWWAxrmY2odzqwBXH2G0nL9KWrvKgXsFsl/8bNLeGOP+jkpzaHXm13SPzEiH6x7zKc5QCpidHl7eow3KKF8hVHaXchWp1UFP17Bmr6YX4Bw3XIqqBKetWNDLwMA1cfYpYP+2x+QrdhfVsYkPKVlTNmPgzCsIcbXB6qVUYMNPZ1m5oJ6NFkWlcAk6U4GnR7iHOmBW1xcKAtof5sKxdzwjDWVyzxwQcLhdkJCbKyEExZSqybkNu52cRLPwSVu7545at+7q9d9mc7UXMMGvA5RQVfKsSAu7Eview3bDdgX6Tb40s2KhD9KJLHEL+3ZX80nqEsmQvN/5by1ot2ScmztjUp2Pc4RTnuA/3h8tC+FnKYt3IqwiqZx4u47Ep6nOnDCrk9sAa/FryeV54AQV9jbZVg8nUEwdhfoVBaYPmTaWmOe9Clojss318I/NKKEjGa2ls3hP5lJc38xQq0zJsQ/jARvMDw9U2oQFzCSsuUdnWasbLrrdt87atE6DzyupWS2yBopYErSFuabHS6LEJWHd9CSvZYuV9sa2Tni9uUWBdXd9wdoey32HXS2S/BI8x9XaJ86Kwpl9AFNbzEJYDEeQhYPCSdKprS8E5gWVLDltR5yRkQmt10J8eV6PsfyWoLwsylN9qDNi6O4x5/eAb5F6XLJUxzjpEixNxuozfivvKZJNscAUE2YzPXjWgsTtoh0RKLlzHkPdOAUMT6YnYB40iiEagiuZ9VBVskREezZEuHymql/ugUfljctw3a3kq+JOfY+MqLpt2TmqCzBQoLbBedddAs5VV5VzqUOKX1NaE8G6qnOY2UV7qRY4nnrFpOOsry5EBXSjGNtJjDaYeV2ohsxoALaygxbY0EBrpIIerHgAAA=", caption: "我男朋友最小气^", captionTranslations: { ko: "내 남자친구 제일 소심해^", zh: "我男朋友最小气^", en: "My boyfriend is so petty^" }, date: "2026-10-31", time: "21:40", likes: 5000, comments: [{ id: "anton-ending-c1", user: "minjae_02", text: "ㅋㅋㅋㅋ终于公开了啊", date: "2026-10-31", time: "21:42" }, { id: "anton-ending-c2", user: "yuna_Yuna", text: "哥哥原来真的有男朋友啊ㅠㅠ", date: "2026-10-31", time: "21:43" }, { id: "anton-ending-c3", user: "sohee.zip", text: "这张照片也太可爱了ㅋㅋ", date: "2026-10-31", time: "21:44" }, { id: "anton-ending-c4", user: "anton_friend", text: "你们两个真的藏得很好呢", date: "2026-10-31", time: "21:45" }, { id: "anton-ending-c5", user: "wonbin", text: "小气鬼ㅋㅋㅋㅋ", date: "2026-10-31", time: "21:46" }] } as SocialPost) : null;
  const storyProgress = readNewStory();
  const storyFriendPosts = friendPosts.filter((p) => p.id !== "friend-yuna-back-20261031" || (storyProgress.stage >= 2 && !storyProgress.yunaPostRemoved));
  const sorted = [...socialFeed(visiblePosts, storyFriendPosts), ...(storyEndingPost ? [storyEndingPost] : [])];
  const account = (id: string): Profile => id === SELF_ID ? prof : accounts.find((a) => a.id === id) ?? prof;
  const selectedProfile = account(profileId);
  const isYunaProfile = profileId === "yuna" || selectedProfile.username === "yuna_Yuna";
  const yunaFollower = accounts.find((a) => a.id === "yuna") ?? FRIEND_ACCOUNTS.find((a) => a.id === "yuna");
  const profilePosts = authorPosts(sorted, profileId);
  const post = sorted.find((p) => p.id === openId);
  const postAuthor = post ? (post.id === "new-story-anton-ending-post" ? { ...account(post.authorId), username: "antinitony", name: "Anton" } : account(post.authorId)) : prof;
  const notifiedAntonPost = useRef<string | null>(null);
  useEffect(() => {
    if (post?.id === "friend-yuna-back-20261031" && notifiedAntonPost.current !== post.id) {
      notifiedAntonPost.current = post.id;
      onAntonPostViewed?.();
    }
  }, [post?.id, onAntonPostViewed]);
  const showProfile = (id: string) => { setProfileId(id); setOpenId(null); setCommentsOpen(false); setTab("profile"); };
  const followYuna = () => {
    if (followedYuna) return;
    setFollowedYuna(true);
    setAccounts((current) => current.map((a) => a.id === "yuna" ? { ...a, followers: String(Number(String(a.followers).replace(/,/g, "")) + 1) } : a));
    setProf((current) => ({ ...current, following: String(Number(String(current.following).replace(/,/g, "")) + 1) }));
  };

  const newPost = () => setDraft({ id: uid(), image: "", caption: "", date: STORY_DATE, likes: 0, comments: [], ...(profileId !== SELF_ID && tab === "profile" ? { authorId: profileId } : {}) });
  const updatePost = (id: string, update: (p: Post) => Post) => {
    if (posts.some((p) => p.id === id)) setPosts((current) => current.map((p) => p.id === id ? update(p) : p));
    else setFriendPosts((current) => current.map((p) => p.id === id ? { ...update(p), authorId: p.authorId } : p));
  };
  const like = (p: Post) => withLocalInteraction(() => updatePost(p.id, (current) => ({ ...current, liked: !current.liked, likes: Math.max(0, current.likes + (current.liked ? -1 : 1)) })));
  const nav = <nav className="ig-bottom-nav">
    {([{ id: "home", icon: Home, title: tr(lang, { en: "Home", ko: "홈", zh: "首页" }) }, { id: "search", icon: Search, title: label(lang, "search") }] as const).map(({ id, icon: Icon, title }) => <Button key={id} variant="ghost" size="icon" aria-label={title} aria-pressed={tab === id} onClick={() => setTab(id)}><Icon strokeWidth={tab === id ? 2.6 : 1.8} /></Button>)}
    {owner && <Button variant="ghost" size="icon" aria-label={tr(lang, { en: "New post", ko: "새 게시물", zh: "新增帖子" })} onClick={newPost}><Plus strokeWidth={1.8} className="ig-plus-box" /></Button>}
    <Button variant="ghost" size="icon" aria-label="Reels" onClick={() => setTab("search")}><Clapperboard strokeWidth={1.8} /></Button>
    <Button variant="ghost" size="icon" aria-label={tr(lang, { en: "Profile", ko: "프로필", zh: "个人主页" })} aria-pressed={tab === "profile"} onClick={() => showProfile(SELF_ID)}><img src={resolveImg(prof.avatar)} alt="" className={`ig-nav-avatar ${tab === "profile" ? "ig-nav-avatar-on" : ""}`} /></Button>
  </nav>;
  const interactions = (p: Post) => <div className="flex items-center gap-1 py-1">
    <Button variant="ghost" size="icon" aria-label={tr(lang, { en: "Like", ko: "좋아요", zh: "点赞" })} aria-pressed={!!p.liked} className={p.liked ? "text-destructive" : ""} onClick={() => like(p)}><Heart fill={p.liked ? "currentColor" : "none"} /></Button>
    <Button variant="ghost" size="icon" aria-label={tr(lang, { en: "Comments", ko: "댓글", zh: "评论" })} onClick={() => { setOpenId(p.id); setImageIndex(0); setCommentsOpen(true); }}><MessageCircle /></Button>
    <Button variant="ghost" size="icon" aria-label={tr(lang, { en: "Share", ko: "공유", zh: "分享" })} onClick={() => setShareId(p.id)}><Send /></Button>
    <Button variant="ghost" size="icon" className="ml-auto" aria-label={tr(lang, { en: "Save post", ko: "게시물 저장", zh: "收藏帖子" })} aria-pressed={!!p.saved} onClick={() => updatePost(p.id, (current) => ({ ...current, saved: !current.saved }))}><Bookmark fill={p.saved ? "currentColor" : "none"} /></Button>
  </div>;
  const share = shareId && <div className="ig-share-sheet" role="dialog"><div className="sheet"><div className="flex justify-between items-center"><b>{tr(lang, { en: "Share", ko: "공유", zh: "分享" })}</b><Button variant="ghost" size="icon" aria-label={C} onClick={() => setShareId(null)}><ArrowLeft /></Button></div>{["anton", "minjae", "doyun"].map((id) => <Button key={id} variant="ghost" className="w-full justify-start" onClick={() => { const shared = sorted.find((p) => p.id === shareId); if (shared) { sendChat("ig", id, `${account(shared.authorId).username} · ${instagramCaption(shared, lang)}`, lang); setShareId(null); setDm(true); } }}>{id === "anton" ? "Anton" : id === "minjae" ? "김민재" : "박도윤"}</Button>)}</div></div>;
  if (showYunaDmPrompt && readNewStory().stage !== 2) return <div className="app-page bg-background">
    <TopBar title={tr(lang, { en: "Following", ko: "팔로우", zh: "已回关" })} left={<BackBtn onClick={() => setShowYunaDmPrompt(false)} />} />
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border bg-card p-5 text-center space-y-3">
        <img src={resolveImg(yunaFollower?.avatar ?? "img:campus")} alt="" className="w-16 h-16 rounded-full object-cover mx-auto" />
        <b className="block">{tr(lang, { en: "You followed Yuna back", ko: "유나님을 맞팔로우했습니다", zh: "你已回关 Yuna" })}</b>
        <p className="text-sm text-muted-foreground">{tr(lang, { en: "Yuna has sent you a message.", ko: "유나님이 메시지를 보냈어요.", zh: "Yuna 给你发来了一条私信。" })}</p>
        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={() => setShowYunaDmPrompt(false)}>{tr(lang, { en: "Later", ko: "나중에", zh: "稍后再看" })}</Button>
          <Button className="flex-1" onClick={() => { setShowYunaDmPrompt(false); setDm(true); }}>{tr(lang, { en: "View message", ko: "메시지 보기", zh: "查看私信" })}</Button>
        </div>
      </div>
    </div>
  </div>;
  if (dm) return <InstagramDM accounts={accounts} lang={lang} onClose={() => setDm(false)} onYunaProfile={() => { setDm(false); showProfile("yuna"); }} initialContactId={initialDmContactId ?? "yuna"} />;

  if (activity) {
    const follower = yunaFollower;
    return <div className="app-page bg-background">
      <TopBar title={tr(lang, { en: "Notifications", ko: "알림", zh: "通知" })} left={<BackBtn onClick={() => setActivity(false)} />} />
      <div className="flex-1 overflow-y-auto p-3">
        <p className="text-sm font-semibold px-1 py-2">{tr(lang, { en: "New", ko: "새 소식", zh: "最新" })}</p>
        {readNewStory().stage === 7 && <Button variant="ghost" className="w-full h-auto justify-start gap-3 py-3 px-2" onClick={() => { updateNewStory({ stage: 8 }); setActivity(false); }}>
          <span className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center font-semibold">A</span>
          <span className="flex-1 text-left text-sm"><b>antinitony</b> {tr(lang, { en: "liked your post.", ko: "님이 회원님의 게시물을 좋아합니다.", zh: "赞了你的帖子。" })}<span className="block text-xs text-muted-foreground mt-1">2026.10.31</span></span>
          <Heart size={18} className="text-rose-500" />
        </Button>}
        {follower && <Button variant="ghost" className="w-full h-auto justify-start gap-3 py-3 px-2" onClick={() => { setActivity(false); showProfile(follower.id); }}>
          <img src={resolveImg(follower.avatar)} alt="" className="w-11 h-11 rounded-full object-cover" />
          <span className="flex-1 text-left text-sm"><b>{follower.username}</b> {tr(lang, { en: "started following you.", ko: "님이 회원님을 팔로우하기 시작했습니다.", zh: "开始关注了你。" })}<span className="block text-xs text-muted-foreground mt-1">{tr(lang, { en: "Yesterday", ko: "어제", zh: "昨天" })}</span></span>
          <span role="button" className="text-xs text-primary font-semibold" onClick={(e) => { e.stopPropagation(); followYuna(); setActivity(false); setShowYunaDmPrompt(true); }}>{followedYuna ? tr(lang, { en: "Following", ko: "팔로잉", zh: "关注" }) : tr(lang, { en: "Follow", ko: "팔로우", zh: "关注" })}</span>
        </Button>}
      </div>
    </div>;
  }

  if (draft) {
    const set = (p: Partial<Post>) => setDraft({ ...draft, ...p });
    return (
      <div className="app-page bg-background">
        <TopBar title={tr(lang, { en: "Edit post", ko: "게시물 수정", zh: "编辑帖子" })} />
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {postImages(draft).map((image, i) => <div key={i} className="flex items-center gap-1 flex-wrap">
            <ImageField label={label(lang, "photo")} value={image} onChange={(v) => { const images = [...postImages(draft)]; images[i] = v; set({ images, image: images[0] ?? "" }); }} />
            <Button variant="ghost" size="icon" aria-label="↑" disabled={i === 0} onClick={() => { const images = moveImage(postImages(draft), i, -1); set({ images, image: images[0] ?? "" }); }}><ArrowUp /></Button>
            <Button variant="ghost" size="icon" aria-label="↓" disabled={i === postImages(draft).length - 1} onClick={() => { const images = moveImage(postImages(draft), i, 1); set({ images, image: images[0] ?? "" }); }}><ArrowDown /></Button>
            <Button variant="ghost" size="icon" aria-label={label(lang, "delete")} onClick={() => { if (!confirmDelete(lang)) return; const images = postImages(draft).filter((_, index) => index !== i); set({ images, image: images[0] ?? "" }); }}><Trash2 /></Button>
          </div>)}
          <Button variant="secondary" onClick={() => set({ images: [...postImages(draft), ""] })}><Plus />{label(lang, "photo")}</Button>
          <Field label={label(lang, "caption")}><textarea className="sheet-input" rows={3} value={instagramCaption(draft, lang)} onChange={(e) => setDraft(editInstagramCaption(draft, lang, e.target.value))} /></Field>
          <div className="flex gap-2">
            <Field label={tr(lang, { en: "Date", ko: "날짜", zh: "发布时间" })}><input type="date" className="sheet-input" value={draft.date} onChange={(e) => set({ date: e.target.value })} /></Field>
            <Field label={label(lang, "time")}><input type="time" className="sheet-input" value={draft.time ?? ""} onChange={(e) => set({ time: e.target.value })} /></Field>
            <Field label={tr(lang, { en: "Likes", ko: "좋아요", zh: "点赞数" })}><input type="number" className="sheet-input" value={draft.likes} onChange={(e) => set({ likes: +e.target.value })} /></Field>
          </div>
          <div className="text-xs text-muted-foreground">{tr(lang, { en: "Comments", ko: "댓글", zh: "评论" })}</div>
          {draft.comments.map((c) => (
            <div key={c.id} className="flex gap-2">
              <input className="sheet-input w-28" value={c.user} onChange={(e) => set({ comments: draft.comments.map((x) => (x.id === c.id ? { ...x, user: e.target.value } : x)) })} />
              <input className="sheet-input flex-1" value={c.text} onChange={(e) => set({ comments: draft.comments.map((x) => (x.id === c.id ? { ...x, text: e.target.value } : x)) })} />
              <button className="text-destructive" onClick={() => { if (confirmDelete(lang)) set({ comments: draft.comments.filter((x) => x.id !== c.id) }); }}>🗑</button>
            </div>
          ))}
          <button className="edit-chip" onClick={() => set({ comments: [...draft.comments, { id: uid(), user: "user", text: "" }] })}>＋ {tr(lang, { en: "Comment", ko: "댓글", zh: "评论" })}</button>
          <button className="w-full py-2.5 rounded-xl bg-muted text-destructive" onClick={() => { if (!confirmDelete(lang)) return; if ("authorId" in draft && draft.authorId !== SELF_ID) setFriendPosts((current) => current.filter((p) => p.id !== draft.id)); else setPosts((current) => current.filter((p) => p.id !== draft.id)); setDraft(null); setOpenId(null); }}>
            {tr(lang, { en: "Delete post", ko: "게시물 삭제", zh: "删除帖子" })}
          </button>
        </div>
        <EditBar save={S} cancel={C} onCancel={() => setDraft(null)} onSave={() => {
          if ("authorId" in draft && typeof draft.authorId === "string" && draft.authorId !== SELF_ID) {
            const saved = { ...draft, authorId: draft.authorId };
            setFriendPosts((current) => current.some((p) => p.id === draft.id) ? current.map((p) => p.id === draft.id ? saved : p) : [saved, ...current]);
          } else setPosts((current) => current.some((p) => p.id === draft.id) ? current.map((p) => p.id === draft.id ? draft : p) : [draft, ...current]);
          setOpenId(draft.id); setDraft(null);
        }} />
      </div>
    );
  }

  if (profDraft) {
    const set = (p: Partial<Profile>) => setProfDraft({ ...profDraft, ...p });
    return (
      <div className="app-page bg-background">
        <TopBar title={tr(lang, { en: "Edit profile", ko: "프로필 편집", zh: "编辑主页" })} />
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <ImageField label={tr(lang, { en: "Avatar", ko: "프로필 사진", zh: "头像" })} value={profDraft.avatar} onChange={(v) => set({ avatar: v })} />
          {(["username", "name", "followers", "following"] as const).map((k) => (
            <Field key={k} label={label(lang, k)}><input className="sheet-input" value={profDraft[k]} onChange={(e) => set({ [k]: e.target.value })} /></Field>
          ))}
          <Field label={label(lang, "bio")}><textarea className="sheet-input" rows={3} value={profDraft.bio} onChange={(e) => set({ bio: e.target.value })} /></Field>
        </div>
        <EditBar save={S} cancel={C} onCancel={() => setProfDraft(null)} onSave={() => { if (profileId === SELF_ID) setProf(profDraft); else setAccounts((current) => current.map((a) => a.id === profileId ? { ...a, ...profDraft } : a)); setProfDraft(null); }} />
      </div>
    );
  }

  if (post && commentsOpen) return <div className="app-page bg-background">
    <TopBar title={tr(lang, { en: "Comments", ko: "댓글", zh: "评论" })} left={<BackBtn onClick={() => { setCommentsOpen(false); setCommentDraft(null); }} />} />
    <div className="flex-1 overflow-y-auto p-3 space-y-4">
      <p className="border-b pb-3 text-sm"><b>{postAuthor.username}</b> {instagramCaption(post, lang)}</p>
      {post.comments.map((c) => <div key={c.id} className="flex gap-2 items-start"><span className="ig-comment-avatar"><User size={18} /></span><div className="flex-1 min-w-0 text-sm"><b>{c.user}</b><p className="whitespace-pre-wrap break-words">{c.text}</p>{c.date && <span className="text-xs text-muted-foreground">{c.date} {c.time}</span>}<div className="flex gap-3">{owner && <Button variant="ghost" size="sm" onClick={() => setCommentDraft({ id: c.id, text: c.text })}>{label(lang, "edit")}</Button>}<Button variant="ghost" size="sm" onClick={() => setComment(`@${c.user} `)}>{label(lang, "reply")}</Button>{owner && <Button variant="ghost" size="icon" aria-label={label(lang, "delete")} onClick={() => { if (confirmDelete(lang)) updatePost(post.id, (p) => ({ ...p, comments: p.comments.filter((x) => x.id !== c.id) })); }}><Trash2 size={14} /></Button>}</div></div></div>)}
      {commentDraft && <div className="space-y-2"><input className="sheet-input" aria-label={tr(lang, { en: "Edit comment", ko: "댓글 수정", zh: "编辑评论" })} value={commentDraft.text} onChange={(e) => setCommentDraft({ ...commentDraft, text: e.target.value })} /><Button onClick={() => { updatePost(post.id, (p) => ({ ...p, comments: p.comments.map((c) => c.id === commentDraft.id ? { ...c, text: commentDraft.text } : c) })); setCommentDraft(null); }}>{S}</Button><Button variant="ghost" onClick={() => setCommentDraft(null)}>{C}</Button></div>}
    </div>
    <form className="kkt-input" onSubmit={(e) => { e.preventDefault(); if (!comment.trim()) return; withLocalInteraction(() => updatePost(post.id, (p) => ({ ...p, comments: [...p.comments, { id: uid(), user: prof.username, text: comment.trim(), date: STORY_DATE, time: "20:26", source: "player" }] }))); setComment(""); }}><input className="kkt-compose" aria-label={tr(lang, { en: "Add comment", ko: "댓글 입력", zh: "输入评论" })} value={comment} onChange={(e) => setComment(e.target.value)} /><Button size="icon" aria-label={tr(lang, { en: "Post comment", ko: "댓글 게시", zh: "发布评论" })} disabled={!comment.trim()}><Send /></Button></form>
  </div>;

  if (post)
    return (
      <div className="app-page bg-background">
        <TopBar left={<BackBtn onClick={() => { setOpenId(null); setCommentsOpen(false); }} />} title={tr(lang, { en: "Posts", ko: "게시물", zh: "帖子" })}
          right={owner && <Button variant="ghost" size="sm" onClick={() => setDraft({ ...post, comments: post.comments.map((c) => ({ ...c })) })}>{post.authorId === SELF_ID ? label(lang, "edit") : tr(lang, { en: "Manage post", ko: "게시물 관리", zh: "管理编辑" })}</Button>} />
        <div className="flex-1 overflow-y-auto">
          <Button variant="ghost" className="h-auto w-full justify-start gap-2 py-2" onClick={() => showProfile(post.authorId)}><img src={resolveImg(postAuthor.avatar)} alt="" className="w-8 h-8 rounded-full object-cover ig-ring" /><b>{postAuthor.username}</b></Button>
          <div className="relative aspect-square bg-muted">
            {postImages(post)[imageIndex] ? <img src={resolveImg(postImages(post)[imageIndex])} alt="" className="w-full h-full object-contain" /> : post.id === "new-story-anton-ending-post" ? <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">照片稍后补上</div> : null}
            {imageIndex > 0 && <Button variant="secondary" size="icon" className="absolute left-2 top-1/2" onClick={() => setImageIndex(imageIndex - 1)}>‹</Button>}
            {imageIndex < postImages(post).length - 1 && <Button variant="secondary" size="icon" className="absolute right-2 top-1/2" onClick={() => setImageIndex(imageIndex + 1)}>›</Button>}
            {postImages(post).length > 1 && <span className="absolute bottom-2 right-2 bg-background text-foreground px-2 text-xs">{imageIndex + 1}/{postImages(post).length}</span>}
          </div>
          <div className="px-3 py-2 space-y-1.5 text-sm">
            {interactions(post)}
            <b>{post.likes.toLocaleString()} {tr(lang, { en: "likes", ko: "좋아요", zh: "次赞" })}</b>
            {post.id === "friend-yuna-back-20261031" && <p className="text-xs text-muted-foreground">{tr(lang, { en: "Liked by anton", ko: "anton님이 좋아합니다", zh: "Anton 点赞了这条帖子" })}</p>}
            <p><b>{postAuthor.username}</b> {instagramCaption(post, lang)}</p>
            <Button variant="ghost" className="px-0 h-auto text-muted-foreground" onClick={() => setCommentsOpen(true)}>{tr(lang, { en: `View all ${post.comments.length} comments`, ko: `댓글 ${post.comments.length}개 모두 보기`, zh: `查看全部 ${post.comments.length} 条评论` })}</Button>
            {post.comments.slice(0, 2).map((c) => <p key={c.id}><b>{c.user}</b> {c.text}</p>)}
            <p className="text-xs text-muted-foreground">{post.date.replaceAll("-", ".")} {post.time}</p>
          </div>
        </div>
        {share}
      </div>
    );

  if (tab !== "profile") return <div className="app-page bg-background">
    <header className="ig-header"><Button variant="ghost" size="icon" aria-label={C} onClick={onHome}><ChevronLeft /></Button><span className="ig-logo">Instagram</span><span className="flex-1" /><Button variant="ghost" size="icon" className="relative" aria-label={tr(lang, { en: "Notifications", ko: "알림", zh: "通知" })} onClick={() => { setNewFollowerUnread(false); setActivity(true); }}><Heart strokeWidth={1.8} />{(newFollowerUnread || readNewStory().stage === 7) && <span className="absolute right-1 top-1 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-background" />}</Button><Button variant="ghost" size="icon" aria-label={tr(lang, { en: "Messages", ko: "메시지", zh: "私信" })} onClick={() => setDm(true)}><Send strokeWidth={1.8} /></Button></header>
    <div className="flex-1 overflow-y-auto">
      {tab === "home" ? <>{readNewStory().stage >= 11 && <Button variant="ghost" className="w-full justify-start gap-3 px-4 py-3 border-b rounded-none" onClick={() => { setOpenId("new-story-anton-ending-post"); setImageIndex(0); }}><span className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-semibold">A</span><span className="text-left text-sm"><b className="block">antinitony</b><span className="text-muted-foreground">提到了你 · Mentioned you</span></span></Button>}<Stories posts={sorted} profile={prof} accounts={accounts} lang={lang} onProfile={showProfile} />{sorted.map((p) => <article key={p.id} className="border-b pb-3">
        <Button variant="ghost" className="h-auto w-full justify-start gap-2 py-2" onClick={() => showProfile(p.authorId)}><img src={resolveImg(account(p.authorId).avatar)} className="w-8 h-8 rounded-full object-cover ig-ring" alt="" /><b className="text-[13px]">{p.id === "new-story-anton-ending-post" ? "antinitony" : account(p.authorId).username}</b><MoreHorizontal className="ml-auto" size={18} /></Button>
        <Button variant="ghost" className="ig-feed-photo" aria-label={tr(lang, { en: "Open post", ko: "게시물 열기", zh: "打开帖子" })} onClick={() => { setOpenId(p.id); setImageIndex(0); }}>{postImages(p)[0] && <img src={resolveImg(postImages(p)[0])} alt="" loading="lazy" />}{postImages(p).length > 1 && <span className="ig-image-count">1/{postImages(p).length}</span>}</Button>
        <div className="px-3 text-sm">{interactions(p)}<b>{p.likes.toLocaleString()} {tr(lang, { en: "likes", ko: "좋아요", zh: "次赞" })}</b><p className="whitespace-pre-wrap mt-1"><b>{p.id === "new-story-anton-ending-post" ? "antinitony" : account(p.authorId).username}</b> {instagramCaption(p, lang)}</p><Button variant="ghost" className="px-0 h-auto text-muted-foreground mt-2" onClick={() => { setOpenId(p.id); setCommentsOpen(true); }}>{tr(lang, { en: `View all ${p.comments.length} comments`, ko: `댓글 ${p.comments.length}개 모두 보기`, zh: `查看全部 ${p.comments.length} 条评论` })}</Button><p className="text-xs text-muted-foreground mt-2">{p.date}</p></div>
      </article>)}</> : <><div className="p-3"><input className="sheet-input" aria-label={label(lang, "search")} placeholder={label(lang, "search")} value={query} onChange={(e) => setQuery(e.target.value)} /></div><div className="grid grid-cols-3 gap-0.5">{sorted.filter((p) => `${instagramCaption(p, lang)} ${account(p.authorId).username}`.toLowerCase().includes(query.toLowerCase())).map((p) => <Button variant="ghost" key={p.id} className="ig-search-photo" onClick={() => { setOpenId(p.id); setImageIndex(0); }}><img src={resolveImg(postImages(p)[0])} alt="" /></Button>)}</div></>}
    </div>{nav}{share}
  </div>;

  return (
    <div className="app-page bg-background">
      <TopBar left={<BackBtn onClick={() => { if (profileId === SELF_ID) onHome(); else { setTab("home"); setProfileId(SELF_ID); } }} />} title={selectedProfile.username}
        right={<Button variant="ghost" size="icon" aria-label={tr(lang, { en: "Messages", ko: "메시지", zh: "私信" })} onClick={() => setDm(true)}><Send /></Button>} />
      <div className="flex-1 overflow-y-auto">
        <div className="flex items-center gap-5 px-4 pt-3">
          <img src={resolveImg(selectedProfile.avatar)} alt="" className="w-20 h-20 rounded-full object-cover ig-ring" />
          <div className="flex flex-1 justify-around text-center text-sm">
            <div><b className="block text-base">{profilePosts.length}</b>{tr(lang, { en: "posts", ko: "게시물", zh: "帖子" })}</div>
            <div><b className="block text-base">{selectedProfile.followers}</b>{tr(lang, { en: "followers", ko: "팔로워", zh: "粉丝" })}</div>
            <div><b className="block text-base">{selectedProfile.following}</b>{tr(lang, { en: "following", ko: "팔로잉", zh: "关注" })}</div>
          </div>
        </div>
        <div className="px-4 py-2 text-sm whitespace-pre-line"><b>{selectedProfile.name}</b>{"\n"}{selectedProfile.bio}</div>
        {owner && <div className="px-4 pb-3"><button className="w-full py-1.5 rounded-lg bg-muted text-sm font-semibold" onClick={() => setProfDraft({ ...selectedProfile })}>{profileId === SELF_ID ? tr(lang, { en: "Edit profile", ko: "프로필 편집", zh: "编辑主页" }) : tr(lang, { en: "Manage profile", ko: "프로필 관리", zh: "管理主页" })}</button></div>}
        {isYunaProfile && <div className="px-4 pb-3"><Button className="w-full h-10 font-semibold" variant={followedYuna ? "secondary" : "default"} onClick={() => { if (!followedYuna) { followYuna(); setShowYunaDmPrompt(true); } else setDm(true); }}>{followedYuna ? tr(lang, { en: "Following", ko: "팔로잉", zh: "已关注" }) : tr(lang, { en: "Follow back", ko: "맞팔로우", zh: "回关" })}</Button></div>}
        <>{isYunaProfile && !followedYuna && !owner ? <div className="flex flex-col items-center justify-center gap-2 px-8 py-12 text-center border-t"><div className="w-16 h-16 rounded-full border-2 flex items-center justify-center"><span className="text-3xl">🔒</span></div><b>{tr(lang, { en: "This account is private", ko: "비공개 계정입니다", zh: "此账户为私密账户" })}</b><p className="text-sm text-muted-foreground">{tr(lang, { en: "Follow this account to see their photos and videos.", ko: "팔로우하면 게시물과 동영상을 볼 수 있어요.", zh: "关注此账户后即可查看她的照片和视频。" })}</p></div> : <div className="grid grid-cols-3 gap-0.5">
          {profilePosts.map((p) => (
            <button key={p.id} onClick={() => { setOpenId(p.id); setImageIndex(0); }} className="aspect-square bg-muted">
              {postImages(p)[0] && <img src={resolveImg(postImages(p)[0])} alt="" className="w-full h-full object-cover" loading="lazy" />}
            </button>
          ))}
        </div>}</>
        <p className="text-[10px] text-center text-muted-foreground py-3">{label(lang, "fictional")}</p>
      </div>
      {nav}{share}
    </div>
  );
}
