export const validateEmail = (email) => {
    const value = email.trim();

    const regex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

    return regex.test(value);
};

export const getInitials = (name) => {
    if(!name) return "";

    const cleanedName = name.trim().replace(/\s+/g," ");
    if(!cleanedName) return "";

    const words = cleanedName.split(" ");
    let initials = "";

    for(let i=0;i<Math.min(words.length,2);i++){
        initials += words[i][0];
    }

    return initials.toUpperCase();
}