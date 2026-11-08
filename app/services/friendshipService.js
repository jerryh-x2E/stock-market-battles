const pool = require("../db.js");

function getFriends(userId) {
    return pool.query(
        `SELECT * FROM friendships 
        WHERE user_low = $1 OR user_high = $1`,
        [userId]
    ).then(result => result.rows.map(friendship => {
        const isUserLow = userId === friendship.user_low;
        return { 
            friend: isUserLow ? friendship.user_high : friendship.user_low,
            accepted: friendship.accepted,
            userIsSender: isUserLow === friendship.is_sender_low
         };
    }))
}

function makeFriendRequest(senderId, receiverId) {
    const values = getValues(senderId, receiverId);
    pool.query(
        `INSERT INTO friendships 
        (user_low, user_high, is_sender_low)
        VALUES ($1, $2, $3)`, values
    ).catch(error => {
        if (error.code === 23505) {
            throw new Error("Friend request already exists");
        } else {
            throw new Error("Error querying database");
        }
    });
}

function acceptFriendRequest(receiverId, senderId) {
    const values = getValues(senderId, receiverId);
    pool.query(
        `UPDATE friendships 
        SET accepted = TRUE
        WHERE user_low = $1 AND user_high = $2 
        AND is_sender_low = $3`, values
    );
}

function rejectFriendRequest(receiverId, senderId) {
    const values = getValues(senderId, receiverId);
    pool.query(
        `DELETE FROM friendships 
        WHERE user_low = $1 AND user_high = $2
        AND is_sender_low = $3`, values
    );
}

function getValues(senderId, receiverId) {
    return senderId < receiverId ? 
    [senderId, receiverId, true] : 
    [receiverId, senderId, false];
}