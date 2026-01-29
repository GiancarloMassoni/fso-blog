const dummy = (blogs) => {
  return 1;
};

const totalLikes = (blogs) => {
  const reducer = (sum, item) => {
    return sum + item.likes;
  };

  return blogs.reduce(reducer, 0);
};

const favoriteBlog = (blogs) => {
  const reducer = (favorite, blog) => {
    return blog.likes > favorite.likes ? blog : favorite;
  };

  return blogs.reduce(reducer, blogs[0]);
};

module.exports = { dummy, totalLikes, favoriteBlog };
