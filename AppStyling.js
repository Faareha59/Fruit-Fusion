import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f6f4',
    padding: 20,
  },
  formWrapper: {
    width: '100%',
    maxWidth: 350,
    padding: 20,
    backgroundColor: '#f3f6f4',
    borderRadius: 25,
    boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
    zIndex: 3,
  },
  formWrapperHeading: {
    fontSize: 24,
    fontWeight:'bold',
    textAlign: 'center',
    color: '#556b2f',
    marginBottom: 15,
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginVertical: 12,
  },
  input: {
    width: '100%',
    padding: 14,
    backgroundColor: '#efefef',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#556b2f',
    padding: 15,
    borderRadius: 10,
    marginVertical: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: '#e4e1e1',
    fontSize: 18,
    fontWeight: '500',
  },
  signupText: {
    textAlign: 'center',
    fontSize: 16,
  },
  link: {
    color: '#556b2f',
    textDecorationLine: 'underline',
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 30,
    alignSelf: 'center',
  },
  // Signup styles (same as login with different placeholders for email)
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f6f4',
    padding: 20,
  },
  // Story Component
  storycontainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  sContainer: {
    padding: 20,
    alignItems: 'center',
  },
  bookList: {
    width: '100%',
    marginTop: 20,
  },
  heading: {
    fontSize: 25,
    marginVertical: 10,
    color: '#fff',
    fontWeight: 'bold',
    paddingVertical: 10,
    paddingHorizontal: 30,
    backgroundColor: '#556b2f',
    borderRadius: 5,
    textAlign: 'center',
  },
  bookCard: {
    margin: 10,
    padding: 15,
    backgroundColor: '#f3f6f4',
    borderRadius: 10,
    width: 200,
    boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
  },
  bookImage: {
    width: 150,
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },
  bookTitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 10,
  },
  addButton: {
    backgroundColor: '#556b2f',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  buyNowButton: {
    backgroundColor: '#556b2f',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#e4e1e1',
    fontSize: 16,
  },
  
});

export default styles;
