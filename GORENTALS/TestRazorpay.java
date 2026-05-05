import com.razorpay.RazorpayClient;
import org.json.JSONObject;

public class TestRazorpay {
    public static void main(String[] args) {
        try {
            RazorpayClient client = new RazorpayClient("rzp_test_SeZg5VpXOL9ZOX", "pjMGDypSnDKbdfoBbgPDnbvf");
            JSONObject options = new JSONObject();
            options.put("count", 1);
            client.orders.fetchAll(options);
            System.out.println("SUCCESS: Keys are valid!");
        } catch (Exception e) {
            System.out.println("ERROR: " + e.getMessage());
        }
    }
}
